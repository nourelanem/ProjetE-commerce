package com.example.demo.controllers;

import com.example.demo.entities.Role;
import com.example.demo.entities.User;
import com.example.demo.repositories.RoleRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3001")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String nom = body.get("nom");
        String password = body.get("password");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email déjà utilisé"));
        }

        // Assigner le rôle CLIENT par défaut
        Role role = roleRepository.findByNom("ROLE_CLIENT")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setNom("ROLE_CLIENT");
                    return roleRepository.save(r);
                });

        User user = new User();
        user.setNom(nom);
        user.setEmail(email);
        user.setPassword(password); // en clair pour l'instant
        user.setRole(role);

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "nom", saved.getNom(),
                "email", saved.getEmail(),
                "role", saved.getRole().getNom()
        ));
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        Optional<User> opt = userRepository.findByEmail(email);
        if (opt.isEmpty() || !opt.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        }

        User user = opt.get();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "nom", user.getNom(),
                "email", user.getEmail(),
                "role", user.getRole().getNom()
        ));
    }
}