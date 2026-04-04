package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String address;

    // Bidirectional: one supplier → many products
    @OneToMany(mappedBy = "supplier")
    @JsonIgnore  // prevents infinite JSON loop
    private List<Product> products;
}