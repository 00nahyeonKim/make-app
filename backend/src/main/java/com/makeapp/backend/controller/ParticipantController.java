package com.makeapp.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.makeapp.backend.service.ParticipantService;

import lombok.RequiredArgsConstructor;

@RestController // REST API를 만들기 위해 메서드의 반환값을 자동으로 JSON으로 변환 후 HTTP 응답 본문(Response Body)에 담아 클라이언트에 전달
@RequestMapping("/api/meetings/{inviteToken}/participants")
@RequiredArgsConstructor // final 필드 생성자 주입
public class ParticipantController {

    private final ParticipantService participantService;

    
}
