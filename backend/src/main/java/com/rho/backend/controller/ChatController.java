package com.rho.backend.controller;

import com.rho.backend.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendToRoom(@Payload ChatMessage message, Principal principal) {
        message.setSender(principal.getName());
        messagingTemplate.convertAndSend("/topic/rooms/" + message.getRoomId(), message);
    }

    @MessageMapping("/chat.private.{targetUser}")
    public void sendPrivate(@DestinationVariable String targetUser,
                            @Payload ChatMessage message, Principal sender) {
        message.setSender(sender.getName());
        messagingTemplate.convertAndSendToUser(targetUser, "/queue/messages", message);
    }
}
