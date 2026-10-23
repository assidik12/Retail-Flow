package toko_online.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * WebMvcConfig mengonfigurasi static resource handling untuk SPA (Single Page Application).
 * Seluruh path rute client-side (seperti /login, /dashboard, /history, dll) yang bukan file fisik
 * atau endpoint API (/api/**, /actuator/**) akan diforward ke /index.html.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws IOException {
                        // Jangan tangani rute API, Swagger/OpenAPI docs, atau actuator sebagai static resource
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("swagger-ui") 
                                || resourcePath.startsWith("v3/api-docs") || resourcePath.startsWith("actuator")) {
                            return null;
                        }

                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }

                        // Fallback ke index.html hanya jika file fisik /static/index.html benar-benar ada (misal frontend ter-bundle)
                        Resource indexResource = new ClassPathResource("/static/index.html");
                        if (indexResource.exists() && indexResource.isReadable()) {
                            return indexResource;
                        }

                        return null;
                    }
                });
    }
}
