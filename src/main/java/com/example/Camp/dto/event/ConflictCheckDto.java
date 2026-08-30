package com.example.Camp.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConflictCheckDto {
    private boolean hasConflict;
    private boolean advanceNoticeValid;
    private String advanceNoticeError;
    private List<String> conflicts;
    private List<String> leaderConflicts;
    private List<String> scheduleConflicts;
    private List<String> venueConflicts;
}
