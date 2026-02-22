package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    User findUserByEmail(String email);
}
