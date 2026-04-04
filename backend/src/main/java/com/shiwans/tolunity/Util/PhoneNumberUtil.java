package com.shiwans.tolunity.Util;

public final class PhoneNumberUtil {

    private PhoneNumberUtil() {
    }

    public static String normalize(String phoneNumber) {
        return phoneNumber == null ? null : phoneNumber.trim();
    }

    public static boolean isValidNepalMobileNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return false;
        }

        return phoneNumber.matches("^(98|97)\\d{8}$");
    }
}
