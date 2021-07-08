import React, { FC } from 'react';
import { useCodeMirror } from './UseCodeMirror';

interface Props {
  content: string;
  classNames?: string;
  onContentChange: (content: string) => void;
}

export const CodeMirror: FC<Props> = ({ content, classNames = '', onContentChange }) => {
  const editorElementRef = useCodeMirror({ content, onContentChange });

  return <div className={classNames} ref={editorElementRef} />;
};
