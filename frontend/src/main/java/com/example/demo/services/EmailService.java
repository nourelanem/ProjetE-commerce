package com.example.demo.services;

import com.example.demo.entities.LigneCommande;
import com.example.demo.entities.Panier;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String nom, String token) {
        String link = frontendUrl + "?token=" + token;
        String html = baseTemplate(
                "Confirmez votre inscription",
                "Bonjour " + escape(nom) + ",",
                """
                <p style="margin:0 0 18px;color:#52636f;line-height:1.6;">
                  Merci pour votre inscription chez NounouPara. Cliquez sur le bouton ci-dessous pour activer votre compte client.
                </p>
                <a href="%s" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;padding:13px 20px;font-weight:700;">
                  Verifier mon email
                </a>
                <p style="margin:22px 0 0;color:#8aa09a;font-size:13px;line-height:1.5;">
                  Si vous n'avez pas cree ce compte, vous pouvez ignorer ce message.
                </p>
                """.formatted(link)
        );

        sendHtml(toEmail, "Verification de votre email NounouPara", html);
    }

    public void sendOrderConfirmationEmail(String toEmail, String nom, Panier panier) {
        StringBuilder rows = new StringBuilder();
        double total = 0;

        if (panier.getLignes() != null) {
            for (LigneCommande ligne : panier.getLignes()) {
                double sousTotal = ligne.getQuantite() * ligne.getPrixUnitaire();
                total += sousTotal;
                rows.append("""
                    <tr>
                      <td style="padding:12px;border-bottom:1px solid #e8f0ed;color:#193c3a;">%s</td>
                      <td style="padding:12px;border-bottom:1px solid #e8f0ed;text-align:center;color:#52636f;">%d</td>
                      <td style="padding:12px;border-bottom:1px solid #e8f0ed;text-align:right;color:#0f766e;font-weight:700;">%.2f TND</td>
                    </tr>
                    """.formatted(
                        escape(ligne.getProduct().getName()),
                        ligne.getQuantite(),
                        sousTotal
                    ));
            }
        }

        String html = baseTemplate(
                "Commande confirmee",
                "Bonjour " + escape(nom) + ",",
                """
                <p style="margin:0 0 18px;color:#52636f;line-height:1.6;">
                  Votre commande #%d a bien ete enregistree. Voici le recapitulatif de vos produits.
                </p>
                <table style="width:100%%;border-collapse:collapse;background:#fff;border:1px solid #e8f0ed;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#0f766e;color:#fff;">
                      <th style="padding:12px;text-align:left;">Produit</th>
                      <th style="padding:12px;text-align:center;">Qte</th>
                      <th style="padding:12px;text-align:right;">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>%s</tbody>
                </table>
                <p style="margin:18px 0 0;text-align:right;color:#193c3a;font-size:20px;font-weight:800;">Total : %.2f TND</p>
                <p style="margin:22px 0 0;color:#8aa09a;font-size:13px;line-height:1.5;">
                  Merci pour votre achat chez NounouPara. Notre equipe prepare votre commande.
                </p>
                """.formatted(panier.getId(), rows.toString(), total)
        );

        sendHtml(toEmail, "Confirmation de votre commande #" + panier.getId(), html);
    }

    private void sendHtml(String toEmail, String subject, String html) {
        try {
            if (fromEmail == null || fromEmail.isBlank()) {
                System.err.println("Email non envoye: spring.mail.username est vide.");
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Erreur envoi email: " + e.getMessage());
        }
    }

    private String baseTemplate(String title, String greeting, String content) {
        return """
            <div style="margin:0;padding:28px;background:#f6faf8;font-family:Arial,sans-serif;">
              <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dce8e5;border-radius:10px;overflow:hidden;">
                <div style="background:#0f766e;padding:22px 26px;color:#ffffff;">
                  <div style="font-size:13px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;">NounouPara</div>
                  <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;">%s</h1>
                </div>
                <div style="padding:26px;">
                  <p style="margin:0 0 8px;color:#193c3a;font-size:17px;font-weight:700;">%s</p>
                  %s
                </div>
              </div>
            </div>
            """.formatted(title, greeting, content);
    }

    private String escape(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
