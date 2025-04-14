import React, { useEffect } from 'react';
import AceEditor from 'react-ace';

// Import language modes
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-c_cpp';

// Import themes
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-tomorrow_night';

// Import extensions
import 'ace-builds/src-noconflict/ext-language_tools';

const CodeEditor = ({
  value,
  onChange,
  language = 'python',
  theme = 'github',
  height = '400px',
  width = '100%',
  readOnly = false,
  fontSize = 14,
  showPrintMargin = true,
  highlightActiveLine = true,
}) => {
  // Map languages to their Ace modes
  const languageMap = {
    'python': 'python',
    'java': 'java',
    'javascript': 'javascript',
    'js': 'javascript',
    'c++': 'c_cpp',
    'cpp': 'c_cpp',
  };
  
  // Use mapped language or default to text
  const aceLanguage = languageMap[language.toLowerCase()] || 'text';

  // Handle onChange event
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="code-editor">
      <AceEditor
        mode={aceLanguage}
        theme={theme}
        onChange={handleChange}
        value={value || ''}
        name="code-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
        }}
        fontSize={fontSize}
        showPrintMargin={showPrintMargin}
        highlightActiveLine={highlightActiveLine}
        width={width}
        height={height}
        readOnly={readOnly}
      />
    </div>
  );
};

export default CodeEditor;
