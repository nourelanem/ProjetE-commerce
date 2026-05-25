package com.example.demo.controllers;

import com.example.demo.entities.Role;
import com.example.demo.entities.User;
import com.example.demo.repositories.RoleRepository;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = cleanEmail(body.get("email"));
        String nom = cleanText(body.get("nom"));
        String password = body.get("password");

        if (email.isBlank() || nom.isBlank() || password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nom, email et mot de passe de 6 caracteres minimum sont requis."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cet email est deja utilise."));
        }

        Role role = roleRepository.findByNom("ROLE_CLIENT")
                .orElseGet(() -> {
                    Role createdRole = new Role();
                    createdRole.setNom("ROLE_CLIENT");
                    return roleRepository.save(createdRole);
                });

        String verificationToken = UUID.randomUUID().toString();

        User user = new User();
        user.setNom(nom);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEmailVerified(false);
        user.setVerificationToken(verificationToken);
        userRepository.save(user);

        emailService.sendVerificationEmail(email, nom, verificationToken);

        if (isLocalMailMode()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Inscription reussie. En mode local, utilisez le bouton de verification affiche.",
                    "verificationUrl", verificationUrl(verificationToken)
            ));
        }

        return ResponseEntity.ok(Map.of("message", "Inscription reussie. Verifiez votre email pour activer votre compte."));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        Optional<User> found = userRepository.findByVerificationToken(token);
        if (found.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lien de verification invalide ou deja utilise."));
        }

        User user = found.get();
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        String jwt = jwtUtil.generateToken(user.getEmail(), user.getRole().getNom());

        return ResponseEntity.ok(Map.of(
                "message", "Email verifie avec succes. Vous etes connecte.",
                "token", jwt,
                "id", user.getId(),
                "nom", user.getNom(),
                "email", user.getEmail(),
                "role", user.getRole().getNom()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = cleanEmail(body.get("email"));
        String password = body.get("password");

        Optional<User> found = userRepository.findByEmail(email);
        if (found.isEmpty() || password == null || !passwordEncoder.matches(password, found.get().getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect."));
        }

        User user = found.get();
        if (!user.isEmailVerified()) {
            if (isLocalMailMode() && user.getVerificationToken() != null) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Verifiez votre email avant de vous connecter.",
                        "verificationUrl", verificationUrl(user.getVerificationToken())
                ));
            }
            return ResponseEntity.status(403).body(Map.of("error", "Verifiez votre email avant de vous connecter."));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().getNom());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "id", user.getId(),
                "nom", user.getNom(),
                "email", user.getEmail(),
                "role", user.getRole().getNom()
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = cleanEmail(body.get("email"));
        Optional<User> found = userRepository.findByEmail(email);

        if (found.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aucun compte ne correspond a cet email."));
        }

        User user = found.get();
        if (user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("message", "Ce compte est deja verifie. Vous pouvez vous connecter."));
        }

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getNom(), token);

        if (isLocalMailMode()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Nouveau lien de verification genere.",
                    "verificationUrl", verificationUrl(token)
            ));
        }

        return ResponseEntity.ok(Map.of("message", "Un nouveau mail de verification a ete envoye."));
    }

    private String cleanEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isLocalMailMode() {
        return mailUsername == null
                || mailUsername.isBlank()
                || mailUsername.startsWith("TON_")
                || frontendUrl.contains("localhost")
                || frontendUrl.contains("127.0.0.1");
    }

    private String verificationUrl(String token) {
        return frontendUrl + "?token=" + token;
    }
}
