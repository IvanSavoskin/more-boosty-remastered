import { Message } from "@models/messages/types";

export async function sendMessage<T extends Message, K = undefined>(message: T): Promise<K | void> {
    try {
        return await chrome.runtime.sendMessage<T, K>(message);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Could not establish connection. Receiving end does not exist.") {
                return console.debug(
                    `An error occurred while sending a message of type ${message.type} to destination ${message.target}: No active message receivers`
                );
            }

            return console.warn(
                `An error occurred while sending a message of type ${message.type} to destination ${message.target}: ${error.message}`
            );
        }
    }
}
