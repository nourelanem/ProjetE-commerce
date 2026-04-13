package com.example.demo.entities;

import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom; // "ROLE_CLIENT", "ROLE_ADMIN", "ROLE_SUPERADMIN"

    @OneToMany(mappedBy = "role")
    @JsonIgnore
    private List<User> users;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public List<User> getUsers() { return users; }
    public void setUsers(List<User> users) { this.users = users; }
}