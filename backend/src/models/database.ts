import { User, Document, UserRole } from '../types';

// In-memory storage
export class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private documents: Map<string, Document> = new Map();
  private userTokens: Map<string, string> = new Map(); // userId -> token

  constructor() {
    // Initialize with default admin user
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const adminUser: User = {
      id: 'admin-001',
      username: 'admin',
      email: 'admin@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  // User operations
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Document operations
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getDocumentsByUserId(userId: string): Document[] {
    return Array.from(this.documents.values()).filter(doc => doc.uploadedBy === userId);
  }

  createDocument(document: Document): Document {
    this.documents.set(document.id, document);
    return document;
  }

  updateDocument(id: string, updates: Partial<Document>): Document | undefined {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  // Token operations
  storeUserToken(userId: string, token: string): void {
    this.userTokens.set(userId, token);
  }

  getUserToken(userId: string): string | undefined {
    return this.userTokens.get(userId);
  }

  removeUserToken(userId: string): boolean {
    return this.userTokens.delete(userId);
  }

  // Search operations
  searchDocuments(query: string): Document[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const database = new InMemoryDatabase();