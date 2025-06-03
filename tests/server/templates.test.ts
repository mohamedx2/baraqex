import {
  generateDocument,
  generateErrorPage,
  generateLoadingPage
} from '../../src/server/templates';

describe('Server Templates', () => {
  describe('generateDocument', () => {
    it('should generate basic HTML document', () => {
      const content = '<h1>Hello World</h1>';
      const html = generateDocument(content);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('<title>Frontend Hamroun App</title>');
      expect(html).toContain(content);
      expect(html).toContain('<div id="app-root"');
    });

    it('should use custom options', () => {
      const content = '<div>Content</div>';
      const options = {
        title: 'Custom Title',
        description: 'Custom description',
        lang: 'fr',
        bodyClasses: 'custom-class',
        scripts: ['/custom.js'],
        styles: ['/custom.css']
      };
      
      const html = generateDocument(content, options);
      
      expect(html).toContain('<title>Custom Title</title>');
      expect(html).toContain('name="description" content="Custom description"');
      expect(html).toContain('<html lang="fr"');
      expect(html).toContain('class="custom-class"');
      expect(html).toContain('src="/custom.js"');
      expect(html).toContain('href="/custom.css"');
    });

    it('should include initial data script', () => {
      const content = '<div>Content</div>';
      const initialData = { user: 'test', id: 123 };
      
      const html = generateDocument(content, { initialData });
      
      expect(html).toContain('id="__APP_DATA__"');
      expect(html).toContain('&quot;user&quot;:&quot;test&quot;');
      expect(html).toContain('&quot;id&quot;:123');
    });

    it('should escape HTML in attributes', () => {
      const content = '<div>Content</div>';
      const options = {
        title: 'Title with "quotes" & <tags>',
        htmlAttrs: { 'data-test': 'value with "quotes"' }
      };
      
      const html = generateDocument(content, options);
      
      expect(html).toContain('Title with &quot;quotes&quot; &amp; &lt;tags&gt;');
      expect(html).toContain('data-test="value with &quot;quotes&quot;"');
    });
  });

  describe('generateErrorPage', () => {
    it('should generate 404 error page', () => {
      const html = generateErrorPage(404, 'Page not found');
      
      expect(html).toContain('<h1>404</h1>');
      expect(html).toContain('<h2>Not Found</h2>');
      expect(html).toContain('Page not found');
      expect(html).toContain('Back to Home');
      expect(html).toContain('<title>404 - Not Found</title>');
    });

    it('should generate 500 error page', () => {
      const html = generateErrorPage(500, 'Internal server error');
      
      expect(html).toContain('<h1>500</h1>');
      expect(html).toContain('<h2>Internal Server Error</h2>');
      expect(html).toContain('Internal server error');
    });

    it('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test';
      
      const html = generateErrorPage(500, 'Server error', error);
      
      expect(html).toContain('error-details');
      expect(html).toContain('Error: Test error');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      const html = generateErrorPage(500, 'Server error', error);
      
      // Check that error-details class is not present in production
      expect(html).not.toContain('class="error-details"');
      expect(html).not.toContain('Test error');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('generateLoadingPage', () => {
    it('should generate loading page with default message', () => {
      const html = generateLoadingPage();
      
      expect(html).toContain('Loading...');
      expect(html).toContain('spinner');
      expect(html).toContain('<title>Loading</title>');
    });

    it('should generate loading page with custom message', () => {
      const html = generateLoadingPage('Please wait...');
      
      expect(html).toContain('Please wait...');
      expect(html).toContain('spinner');
    });

    it('should escape HTML in message', () => {
      const html = generateLoadingPage('Loading <script>alert("xss")</script>');
      
      expect(html).toContain('Loading &lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });
  });
});
