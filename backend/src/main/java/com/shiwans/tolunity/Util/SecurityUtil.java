package com.shiwans.tolunity.Util;

import com.shiwans.tolunity.config.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtil {

    private SecurityUtil() {
        // Prevent instantiation
    }

    public static String getCurrentUsername() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        if (principal != null) {
            return ((UserDetails) principal).getUsername();
        }

        return "";
    }

    public static Long getCurrentUserId() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        if (principal != null) {
            return ((CustomUserDetails) principal).getId();
        }

        return null;
    }

    public static Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public static boolean isAuthenticated() {
        Authentication authentication = getAuthentication();

        return authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal());
    }
}