package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<User, Long> {

}
