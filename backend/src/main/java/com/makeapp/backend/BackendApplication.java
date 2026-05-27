package com.makeapp.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
// JPA Auditing 기능을 활성화해서, 엔티티 생성/수정 시간을 자동으로 기록
@EnableJpaAuditing
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
