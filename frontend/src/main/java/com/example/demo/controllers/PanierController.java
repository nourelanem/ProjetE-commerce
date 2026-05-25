package com.example.demo.controllers;

import com.example.demo.entities.LigneCommande;
import com.example.demo.entities.Panier;
import com.example.demo.entities.Product;
import com.example.demo.entities.User;
import com.example.demo.repositories.LigneCommandeRepository;
import com.example.demo.repositories.PanierRepository;
import com.example.demo.repositories.ProductRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/panier")
public class PanierController {

    @Autowired private PanierRepository panierRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private LigneCommandeRepository ligneRepo;
    @Autowired private EmailService emailService;

    @GetMapping("/{userId}")
    public Panier getPanier(@PathVariable Long userId) {
        return panierRepository.findByUserIdAndStatut(userId, "EN_COURS")
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Panier panier = new Panier();
                    panier.setUser(user);
                    panier.setStatut("EN_COURS");
                    panier.setLignes(new ArrayList<>());
                    return panierRepository.save(panier);
                });
    }

    @GetMapping("/{userId}/commandes")
    public List<Panier> getHistoriqueCommandes(@PathVariable Long userId) {
        return panierRepository.findByUserIdAndStatutOrderByDateCommandeDesc(userId, "COMMANDE");
    }

    @PostMapping("/{userId}/ajouter")
    public Panier ajouterProduit(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantite = Math.max(1, Integer.parseInt(body.get("quantite").toString()));

        Panier panier = getPanier(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int quantiteDejaDansPanier = panier.getLignes().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .mapToInt(LigneCommande::getQuantite)
                .sum();

        if (product.getQuantity() < quantiteDejaDansPanier + quantite) {
            throw new RuntimeException("Stock insuffisant pour ce produit");
        }

        LigneCommande ligne = panier.getLignes().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (ligne != null) {
            ligne.setQuantite(ligne.getQuantite() + quantite);
            ligneRepo.save(ligne);
        } else {
            ligne = new LigneCommande();
            ligne.setPanier(panier);
            ligne.setProduct(product);
            ligne.setQuantite(quantite);
            ligne.setPrixUnitaire(product.getPrice());
            ligneRepo.save(ligne);
        }

        return panierRepository.findById(panier.getId()).orElseThrow();
    }

    @DeleteMapping("/ligne/{ligneId}")
    public ResponseEntity<?> supprimerLigne(@PathVariable Long ligneId) {
        ligneRepo.deleteById(ligneId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/commander")
    public ResponseEntity<?> commander(@PathVariable Long userId) {
        Panier panier = getPanier(userId);
        if (panier.getLignes() == null || panier.getLignes().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le panier est vide."));
        }

        panier.setStatut("COMMANDE");
        panier.setDateCommande(LocalDateTime.now());
        for (LigneCommande ligne : panier.getLignes()) {
            Product product = ligne.getProduct();
            if (product.getQuantity() < ligne.getQuantite()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Stock insuffisant pour " + product.getName()
                ));
            }
            product.setQuantity(product.getQuantity() - ligne.getQuantite());
            productRepository.save(product);
        }

        Panier saved = panierRepository.save(panier);
        User user = saved.getUser();
        emailService.sendOrderConfirmationEmail(user.getEmail(), user.getNom(), saved);

        return ResponseEntity.ok(saved);
    }
}
