package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data                   // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor       // Empty constructor
@AllArgsConstructor      // Full constructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
}