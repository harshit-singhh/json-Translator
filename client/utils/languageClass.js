export class Language {
  constructor(name, code, dialect = null) {
    this.name = name; // eg. "Hindi"
    this.code = code; // eg. "hi"
    this.dialect = dialect; // optional, eg. "Awadhi"
  }

  get displayName() {
   
    return `${this.name} (${this.code})`;
  }

  matchesCode(code) {
    return this.code.toLowerCase() === code.toLowerCase();
  }

}
