package com.shiwans.tolunity.Repo;

import com.shiwans.tolunity.entities.User;
import com.shiwans.tolunity.enums.UserRolesEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findUserByEmail(String email);
    User findUserById(Long id);

    Optional<User> findByIdAndDelFlgFalse(Long id);
    Optional<User> findFirstByRoleAndDelFlgFalse(UserRolesEnum role);
    List<User> findAllByDelFlgFalse();
    List<User> findAllByIdInAndDelFlgFalse(Collection<Long> ids);
    List<User> findAllByExpoPushTokenAndDelFlgFalse(String expoPushToken);
    List<User> findByUserTypeAndDelFlgFalse(com.shiwans.tolunity.enums.UserTypeEnum userType);
    List<User> findByOwnerIdAndDelFlgFalse(Long ownerId);
}
