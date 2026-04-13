package com.example.demo.controllers;

import com.example.demo.entities.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3001")
@RestController
@RequestMapping("/panier")
public class PanierController {

    @Autowired private PanierRepository panierRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private LigneCommandeRepository ligneRepo;

    // Récupérer le panier EN_COURS d'un user
    @GetMapping("/{userId}")
    public Panier getPanier(@PathVariable Long userId) {
        return panierRepository.findByUserIdAndStatut(userId, "EN_COURS")
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Panier p = new Panier();
                    p.setUser(user);
                    p.setStatut("EN_COURS");
                    return panierRepository.save(p);
                });
    }

    // Ajouter un produit au panier
    @PostMapping("/{userId}/ajouter")
    public Panier ajouterProduit(@PathVariable Long userId,
                                 @RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantite = Integer.parseInt(body.get("quantite").toString());

        Panier panier = getPanier(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Vérifier si le produit est déjà dans le panier
        LigneCommande ligne = panier.getLignes().stream()
                .filter(l -> l.getProduct().getId().equals(productId))
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

        return panierRepository.findById(panier.getId()).get();
    }

    // Supprimer une ligne du panier
    @DeleteMapping("/ligne/{ligneId}")
    public void supprimerLigne(@PathVariable Long ligneId) {
        ligneRepo.deleteById(ligneId);
    }

    // Valider la commande (passer le statut à COMMANDE)
    @PostMapping("/{userId}/commander")
    public Panier commander(@PathVariable Long userId) {
        Panier panier = getPanier(userId);
        panier.setStatut("COMMANDE");
        return panierRepository.save(panier);
    }
}