package com.rho.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConnectedUserRegistry {

    private static ConnectedUserRegistry instance;

    private final Map<String, Long> lastSeen = new ConcurrentHashMap<>();

    @PostConstruct
    private void init() {
        instance = this;
    }

    public static ConnectedUserRegistry getInstance() {
        return instance;
    }

    /**
     * Registers a username atomically. ConcurrentHashMap.compute() locks the
     * key's hash slot for the duration of the lambda, so no two threads can
     * interleave the staleness check and write for the same username.
     *
     * If already present and lastSeen is within 30s, the existing timestamp is
     * returned unchanged (= false = reject). Otherwise the new timestamp is
     * stored and returned (= true = accept). The {@code result == now} comparison
     * is safe even if two calls happen to share the same millisecond, because
     * compute() serializes execution per key — the second caller's lambda will
     * see the first caller's written timestamp and treat it as a live duplicate.
     */
    public boolean register(String username) {
        long now = System.currentTimeMillis();
        Long result = lastSeen.compute(username, (key, existing) -> {
            if (existing != null && now - existing <= 30_000) {
                return existing;
            }
            return now;
        });
        return result == now;
    }

    public void deregister(String username) {
        lastSeen.remove(username);
    }

    public boolean isConnected(String username) {
        return lastSeen.containsKey(username);
    }
}
