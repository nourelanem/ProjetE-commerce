package com.example.demo;

import com.example.demo.entities.Role;
import com.example.demo.entities.User;
import com.example.demo.repositories.RoleRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role clientRole = createRole("ROLE_CLIENT");
        Role adminRole = createRole("ROLE_ADMIN");
        Role superAdminRole = createRole("ROLE_SUPERADMIN");

        upsertDefaultUser("Super Admin", "superadmin@admin.com", "admin123", superAdminRole);
        upsertDefaultUser("Admin", "admin@admin.com", "admin123", adminRole);
        upsertDefaultUser("Client Test", "client@client.com", "client123", clientRole);
    }

    private Role createRole(String nom) {
        return roleRepository.findByNom(nom).orElseGet(() -> {
            Role role = new Role();
            role.setNom(nom);
            return roleRepository.save(role);
        });
    }

    private void upsertDefaultUser(String nom, String email, String rawPassword, Role role) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setNom(nom);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        System.out.println("Compte pret: " + email + " / " + rawPassword);
    }
}
