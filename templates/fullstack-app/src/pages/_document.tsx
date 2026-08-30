import { jsx } from 'frontend-hamroun';

export default function Document({ 
  title = 'Frontend Hamroun App',
  headContent,
  bodyContent,
  scripts
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
        {headContent}
      </head>
      <body>
        <div id="root">{bodyContent}</div>
        <script src="/build/main.js" type="module"></script>
        {scripts}
      </body>
    </html>
  );
}
