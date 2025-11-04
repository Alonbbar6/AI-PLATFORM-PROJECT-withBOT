-- Seed data for FAQs
-- This file populates the faqs table with initial data

-- Module 1 FAQs
INSERT INTO public.faqs (question, answer, category, keywords) VALUES
('What is the project about?', 'This project is a collaborative platform for teams to manage and share knowledge through an intelligent FAQ system. It includes modules for content management, vector search, and team collaboration.', 'Module 1', '{"introduction", "overview", "project scope"}'),

('How do I get started with the project?', 'To get started, clone the repository, install dependencies with npm install, set up your .env file, and run the development server. Detailed setup instructions are in the README.', 'Module 1', '{"setup", "installation", "getting started"}'),

('What are the system requirements?', 'You''ll need Node.js 18+, npm 9+, and a modern web browser. For development, we recommend VS Code with the recommended extensions.', 'Module 1', '{"requirements", "prerequisites", "setup"}'),

('How do I report a bug?', 'Please create an issue in our GitHub repository with detailed steps to reproduce, expected behavior, and actual behavior. Include screenshots if relevant.', 'Module 1', '{"support", "bugs", "issues"}'),

('Where can I find the project documentation?', 'Documentation is available in the /docs folder of the repository. Start with the README.md for setup and architecture overview.', 'Module 1', '{"documentation", "help", "resources"}'),

-- Module 2 FAQs
('How do I create a new FAQ entry?', 'You can add a new FAQ through the admin dashboard or by submitting a pull request with the FAQ data in the correct format. All entries require review before being published.', 'Module 2', '{"content creation", "faq management", "workflow"}'),

('What''s our Git workflow?', 'We use a feature branch workflow. Create a new branch for each feature, commit changes with clear messages, and open a pull request for review before merging to main.', 'Module 2', '{"git", "version control", "workflow"}'),

('How often should I pull changes?', 'Pull changes from the main branch at least once per day and always before starting new work. This helps prevent merge conflicts and keeps your work up to date.', 'Module 2', '{"git", "collaboration", "best practices"}'),

('How do we handle code reviews?', 'All code changes require at least one approval from a team member. Reviewers should check for code quality, test coverage, and adherence to our coding standards.', 'Module 2', '{"code review", "pull requests", "quality"}'),

('What''s our testing strategy?', 'We follow test-driven development (TDD) where possible. Write unit tests for all new features and ensure all tests pass before submitting a pull request.', 'Module 2', '{"testing", "quality assurance", "tdd"}),

-- Module 3 FAQs
('How do we handle database migrations?', 'Database migrations are managed through SQL files in the migrations folder. Each migration is versioned and should include both up and down migrations where applicable.', 'Module 3', '{"database", "migrations", "schema"}'),

('What''s our approach to security?', 'We follow OWASP security guidelines, implement proper input validation, use parameterized queries, and regularly update dependencies to patch security vulnerabilities.', 'Module 3', '{"security", "best practices", "owasp"}'),

('How do we monitor application performance?', 'We use application performance monitoring (APM) tools to track response times, error rates, and system resources. Performance metrics are available in our monitoring dashboard.', 'Module 3', '{"monitoring", "performance", "apm"}'),

('What''s our backup strategy?', 'We perform daily database backups with point-in-time recovery. Backups are encrypted and stored in multiple geographic locations for disaster recovery.', 'Module 3', '{"backup", "recovery", "disaster"}'),

('How do we handle API versioning?', 'We use URL versioning (e.g., /api/v1/...) for our APIs. Breaking changes require a new version number, and we maintain backward compatibility for at least one previous version.', 'Module 3', '{"api", "versioning", "rest"});

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_keywords ON public.faqs USING GIN (keywords);

-- Update statistics for the query planner
ANALYZE public.faqs;
