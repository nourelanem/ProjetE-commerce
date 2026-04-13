package com.example.demo.repositories;
import com.example.demo.entities.Panier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PanierRepository extends JpaRepository<Panier, Long> {
    Optional<Panier> findByUserIdAndStatut(Long userId, String statut);
}