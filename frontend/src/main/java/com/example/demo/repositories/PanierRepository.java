package com.example.demo.repositories;
import com.example.demo.entities.Panier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PanierRepository extends JpaRepository<Panier, Long> {
    Optional<Panier> findByUserIdAndStatut(Long userId, String statut);
    List<Panier> findByUserIdAndStatutOrderByDateCommandeDesc(Long userId, String statut);
    List<Panier> findByUserId(Long userId);
}
