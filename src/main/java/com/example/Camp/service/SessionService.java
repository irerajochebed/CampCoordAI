package com.example.Camp.service;

import com.example.Camp.dto.session.SessionRequest;
import com.example.Camp.dto.session.SessionResponse;

import java.util.List;

public interface SessionService {
    
    SessionResponse createSession(Long eventId, SessionRequest request);
    
    SessionResponse updateSession(Long id, SessionRequest request);
    
    SessionResponse getSessionById(Long id);
    
    List<SessionResponse> getSessionsByEvent(Long eventId);
    
    List<SessionResponse> getSessionsBySpeaker(Long speakerId);
    
    void deleteSession(Long id);
}
