package com.example.Camp.service.impl;

import com.example.Camp.dto.session.SessionRequest;
import com.example.Camp.dto.session.SessionResponse;
import com.example.Camp.entity.Event;
import com.example.Camp.entity.Session;
import com.example.Camp.entity.User;
import com.example.Camp.repository.AttendanceRepository;
import com.example.Camp.repository.SessionRepository;
import com.example.Camp.service.EventService;
import com.example.Camp.service.SessionService;
import com.example.Camp.service.UserService;
import com.example.Camp.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SessionServiceImpl implements SessionService {
    
    private final SessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EventService eventService;
    private final UserService userService;
    private final DtoMapper dtoMapper;
    
    @Override
    public SessionResponse createSession(Long eventId, SessionRequest request) {
        Event event = eventService.getEventEntity(eventId);
        User speaker = request.getSpeakerId() != null ? userService.getUserById(request.getSpeakerId()) : null;
        
        Session session = Session.builder()
                .event(event)
                .title(request.getTitle())
                .type(request.getType())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .venue(request.getVenue())
                .speaker(speaker)
                .maxAttendees(request.getMaxAttendees())
                .build();
        
        Session savedSession = sessionRepository.save(session);
        log.info("Session created: {} for event {}", savedSession.getTitle(), eventId);
        
        return buildSessionResponse(savedSession);
    }
    
    @Override
    public SessionResponse updateSession(Long id, SessionRequest request) {
        Session session = getSessionEntity(id);
        User speaker = request.getSpeakerId() != null ? userService.getUserById(request.getSpeakerId()) : null;
        
        session.setTitle(request.getTitle());
        session.setType(request.getType());
        session.setDescription(request.getDescription());
        session.setStartTime(request.getStartTime());
        session.setEndTime(request.getEndTime());
        session.setVenue(request.getVenue());
        session.setSpeaker(speaker);
        session.setMaxAttendees(request.getMaxAttendees());
        
        Session savedSession = sessionRepository.save(session);
        log.info("Session updated: {}", id);
        
        return buildSessionResponse(savedSession);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SessionResponse getSessionById(Long id) {
        Session session = getSessionEntity(id);
        return buildSessionResponse(session);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByEvent(Long eventId) {
        return sessionRepository.findByEventIdOrderByStartTime(eventId).stream()
                .map(this::buildSessionResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsBySpeaker(Long speakerId) {
        return sessionRepository.findActiveBySpeaker(speakerId).stream()
                .map(this::buildSessionResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public void deleteSession(Long id) {
        Session session = getSessionEntity(id);
        session.setDeleted(true);
        sessionRepository.save(session);
        log.info("Session soft deleted: {}", id);
    }
    
    private Session getSessionEntity(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + id));
    }
    
    private SessionResponse buildSessionResponse(Session session) {
        Long attendanceCount = attendanceRepository.countBySession(session.getId());
        return dtoMapper.toSessionResponse(session, attendanceCount);
    }
}
