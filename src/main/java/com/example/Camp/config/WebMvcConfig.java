package com.example.Camp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads");
        File uploadFolder = uploadDir.toFile();
        if (!uploadFolder.exists()) {
          uploadFolder.mkdirs();
        }
        String uploadPath = uploadFolder.getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + (uploadPath.endsWith(File.separator) ? uploadPath : uploadPath + File.separator))
                .setCachePeriod(3600);
    }
}
