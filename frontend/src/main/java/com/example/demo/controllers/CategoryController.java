package com.example.demo.controllers;

import com.example.demo.entities.Category;
import com.example.demo.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @GetMapping("/{id}")
    public Category getCategory(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @PostMapping
    public Category createCategory(@RequestBody Category category) {
        return categoryRepository.save(category);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category updated) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setName(updated.getName());
        return categoryRepository.save(category);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
    }
}