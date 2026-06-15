package com.rho.backend.listener;

import com.rho.backend.enums.MessageType;
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
    private final Map<String, Set<String>> roomUsers = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> sessionRooms = new ConcurrentHashMap<>();

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = headers.getDestination();

        if (destination == null || !destination.startsWith("/topic/rooms/")) return;

        Principal user = headers.getUser();
        if (user == null || user.getName() == null) return;
        String username = user.getName();
        String roomId = destination.substring("/topic/rooms/".length());

        Set<String> users = roomUsers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        users.add(username);

        String sessionId = headers.getSessionId();
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

        Map<String, String> roomUserMap = sessionRooms.remove(sessionId);
        if (roomUserMap == null) return;

        for (Map.Entry<String, String> entry : roomUserMap.entrySet()) {
            String roomId = entry.getKey();
            String username = entry.getValue();

            Set<String> users = roomUsers.get(roomId);
            if (users == null) continue;

            users.remove(username);

            int currentCount = users.size();
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", username);
            payload.put("type", MessageType.LEAVE.name());
            payload.put("roomId", roomId);
            payload.put("content", username + " left");
            payload.put("userCount", currentCount);
            messagingTemplate.convertAndSend("/topic/rooms/" + roomId, (Object) payload);

            if (users.isEmpty()) {
                roomUsers.remove(roomId);
            }
        }
    }
}
