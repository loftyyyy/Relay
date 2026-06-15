package com.rho.backend.listener;

import com.rho.backend.enums.MessageType;
import com.rho.backend.service.ConnectedUserRegistry;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConnectedUserRegistry userRegistry;
    private final Map<String, Set<String>> roomUsers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> sessionRooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUsernames = new ConcurrentHashMap<>();

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate, ConnectedUserRegistry userRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.userRegistry = userRegistry;
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = headers.getDestination();
        Principal user = headers.getUser();
        String sessionId = headers.getSessionId();

        if (user != null && user.getName() != null && sessionId != null) {
            sessionUsernames.put(sessionId, user.getName());
        }

        if (destination == null || !destination.startsWith("/topic/rooms/")) return;

        if (user == null || user.getName() == null) return;
        String username = user.getName();
        String roomId = destination.substring("/topic/rooms/".length());

        Set<String> users = roomUsers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        users.add(username);

        if (sessionId != null) {
            sessionRooms.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>()).put(roomId, username);
        }

        int currentCount = users.size();
        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", username);
        payload.put("type", MessageType.JOIN.name());
        payload.put("roomId", roomId);
        payload.put("content", username + " joined");
        payload.put("userCount", currentCount);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, (Object) payload);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headers.getSessionId();
        if (sessionId == null) return;

        String username = sessionUsernames.remove(sessionId);
        if (username != null) {
            userRegistry.deregister(username);
        }

        Map<String, String> roomUserMap = sessionRooms.remove(sessionId);
        if (roomUserMap == null) return;

        for (Map.Entry<String, String> entry : roomUserMap.entrySet()) {
            String roomId = entry.getKey();
            String uname = entry.getValue();

            Set<String> users = roomUsers.get(roomId);
            if (users == null) continue;

            users.remove(uname);

            int currentCount = users.size();
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", uname);
            payload.put("type", MessageType.LEAVE.name());
            payload.put("roomId", roomId);
            payload.put("content", uname + " left");
            payload.put("userCount", currentCount);
            messagingTemplate.convertAndSend("/topic/rooms/" + roomId, (Object) payload);

            if (users.isEmpty()) {
                roomUsers.remove(roomId);
            }
        }
    }
}
