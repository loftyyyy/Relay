package com.rho.backend.config;

import com.rho.backend.handler.JwtHandshakeHandler;
import com.rho.backend.service.JwtHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.jwt.secret.key}")
    private String jwtSecret;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enables memory-based broker for /topic (broadcast) and /queue (private)
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app"); // client -> server
        config.setUserDestinationPrefix("/user"); // server specific user
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .addInterceptors(new JwtHandshakeInterceptor(jwtSecret))
                .setHandshakeHandler(new JwtHandshakeHandler())
                .setAllowedOriginPatterns("*");
    }
}
