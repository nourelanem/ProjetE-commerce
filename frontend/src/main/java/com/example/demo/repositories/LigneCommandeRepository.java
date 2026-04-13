package com.example.demo.repositories;
import com.example.demo.entities.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {}
