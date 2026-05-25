package com.example.demo.repositories;
import com.example.demo.entities.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {
    @Transactional
    void deleteByProductId(Long productId);
}
