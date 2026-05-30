package com.makeapp.backend.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

// 생성시간, 수정시간 같은 공통 필드를 모든 엔터티에 넣기 위해 생성한 공통 엔터티

@Getter
@MappedSuperclass // 부모 클래스를 테이블 만들지 말고 컬럼 상속용으로 사용
@EntityListeners(AuditingEntityListener.class) // 엔티티 저장/수정 시 자동으로 createdAt, updatedAt 같은 값 채우기 위한 감시자 등록
public class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime created_at;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void delete() {
        this.deletedAt = LocalDateTime.now(); // soft delete를 위해 삭제 시간만 기록
    }
}
