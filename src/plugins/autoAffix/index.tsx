/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    prefix: {
        type: OptionType.STRING,
        description: "The prefix to add to messages",
        default: "",
    },
    suffix: {
        type: OptionType.STRING,
        description: "The suffix to add to messages",
        default: "",
    },
    addSpace: {
        type: OptionType.BOOLEAN,
        description: "Add space before/after the prefix/suffix",
        default: true,
    },
    excludeCommands: {
        type: OptionType.BOOLEAN,
        description: "Don't add prefix/suffix to slash commands (starting with /)",
        default: true,
    },
    ignoreEmpty: {
        type: OptionType.BOOLEAN,
        description: "Ignore empty messages",
        default: true,
    },
    skipAttachments: {
        type: OptionType.BOOLEAN,
        description: "Skip messages with file attachments or GIFs",
        default: true,
    },
    customPatterns: {
        type: OptionType.STRING,
        description: "Don't modify messages containing these words (comma separated)",
        default: "",
        placeholder: "lol, lmao, rofl",
    }
});

export default definePlugin({
    name: "AutoAffix",
    description: "Automatically adds a prefix and/or suffix to every message you send",
    authors: [Devs.falcon],
    tags: ["message", "suffix", "prefix", "auto"],
    settings,

    onBeforeMessageSend(channelId: string, msg: any) {
        if (!msg?.content || typeof msg.content !== "string") return;

        const {
            prefix,
            suffix,
            addSpace,
            excludeCommands,
            ignoreEmpty,
            skipAttachments,
            customPatterns
        } = settings.store;

        const trimmed = msg.content.trim();

        if (ignoreEmpty && !trimmed) return;

        if (excludeCommands && trimmed.startsWith("/")) return;

        if (skipAttachments && this.hasAttachments(msg)) {
            return;
        }

        if (customPatterns.trim()) {
            const patterns = customPatterns.split(",")
                .map(p => p.trim().toLowerCase())
                .filter(p => p.length > 0);

            if (patterns.some(pattern => trimmed.toLowerCase().includes(pattern))) {
                return;
            }
        }

        let newContent = msg.content;
        if (prefix) {
            const space = addSpace ? " " : "";
            newContent = prefix + space + newContent;
        }

        if (suffix) {
            const space = addSpace ? " " : "";
            newContent = newContent + space + suffix;
        }

        if (newContent !== msg.content) {
            msg.content = newContent;
        }
    },

    hasAttachments(msg: any): boolean {
        if (msg.attachments?.length > 0) {
            return true;
        }

        if (msg.stickerItems?.length > 0 || msg.stickers?.length > 0) {
            return true;
        }

        if (msg.attachments?.some?.((a: any) =>
            a.filename?.toLowerCase().endsWith(".gif") ||
            a.content_type?.includes("image/gif")
        )) {
            return true;
        }

        if (msg.content?.match(/\.gif(\?|$)/i) ||
            msg.content?.includes("tenor.com") ||
            msg.content?.includes("giphy.com") ||
            msg.content?.includes("media.giphy.com")) {
            return true;
        }

        return false;
    }
});
