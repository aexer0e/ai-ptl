export default class Constants {
    // Pattern Matching
    public static ENTRY_REGEX = RegExp(/^(\$?[^=]*)=(.*)/);
    public static TERM_REGEX = RegExp(/^([^:].*):([^=]+)/);
    public static REMARK_REGEX = RegExp(/^:(.+)/);
    public static HEADING_REGEX = RegExp(/^(>+)(.+)/);

    // Symbol Matching
    public static PUNCTUATION_REGEX = `.!?,;()\\[\\]{}"' `;
    public static FORMATTING_REGEX = `§[0-9a-fk-or-z]`;
    public static QUOTES_REGEX = `^".*"$|^'.*?'$`;

    // Special Characters
    public static COMMENT_PREFIX = "###";
    public static ALIAS_SEPARATOR = "|";
    public static LOCAL_TERM_PREFIX = "!";
    public static NO_TRANSLATE_PREFIX = "$";

    // Misc
    public static FILE_EXTENSION = ".saplang";
    public static LANG_PATH = "RP/texts/en_US.lang";
    public static NO_TRANSLATE_TEXT = "DO NOT TRANSLATE";
}
