package com.example.demo;

import com.example.demo.entities.Role;
import com.example.demo.entities.User;
import com.example.demo.repositories.RoleRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;

    @Override
    public void run(String... args) {
        // Créer les rôles s'ils n'existent pas
        creerRole("ROLE_CLIENT");
        creerRole("ROLE_ADMIN");
        creerRole("ROLE_SUPERADMIN");

        // Créer le super admin par défaut
        if (userRepository.findByEmail("superadmin@admin.com").isEmpty()) {
            Role role = roleRepository.findByNom("ROLE_SUPERADMIN").get();
            User admin = new User();
            admin.setNom("Super Admin");
            admin.setEmail("superadmin@admin.com");
            admin.setPassword("admin123");
            admin.setRole(role);
            userRepository.save(admin);
            System.out.println("Super admin créé: superadmin@admin.com / admin123");
        }
    }

    private void creerRole(String nom) {
        if (roleRepository.findByNom(nom).isEmpty()) {
            Role r = new Role();
            r.setNom(nom);
            roleRepository.save(r);
        }
    }
}