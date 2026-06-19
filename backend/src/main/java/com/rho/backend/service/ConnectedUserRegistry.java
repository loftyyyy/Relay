package com.rho.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConnectedUserRegistry {

    private static ConnectedUserRegistry instance;

    private final Set<String> connectedUsernames = ConcurrentHashMap.newKeySet();

    @PostConstruct
    private void init() {
        instance = this;
    }

    public static ConnectedUserRegistry getInstance() {
        return instance;
    }

    public boolean register(String username) {
        connectedUsernames.add(username);
        return true;
    }

    public void deregister(String username) {
        connectedUsernames.remove(username);
    }

    public boolean isConnected(String username) {
        return connectedUsernames.contains(username);
    }
}
