package com.shiwans.tolunity.exception;

public class EmailDeliveryException extends RuntimeException {

    private final String clientMessage;

    public EmailDeliveryException(String clientMessage, String message) {
        super(message);
        this.clientMessage = clientMessage;
    }

    public EmailDeliveryException(String clientMessage, String message, Throwable cause) {
        super(message, cause);
        this.clientMessage = clientMessage;
    }

    public String getClientMessage() {
        return clientMessage;
    }
}
