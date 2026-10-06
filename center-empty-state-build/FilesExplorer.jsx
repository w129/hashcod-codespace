import React from 'react';
import { FileTextIcon, FileJsonIcon, FileImageIcon, FileVideoIcon, FileAudioIcon, FileArchiveIcon } from 'lucide-react';
import { Files, FolderItem, FolderTrigger, FolderContent, SubFiles, FileItem } from './animate-ui/Files';
import './files-explorer.css';
import LoadingState from './LoadingState';

function iconFor(file) {
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  if (/^(json|yaml|yml)$/.test(ext)) return FileJsonIcon;
  if (/^(png|jpe?g|gif|webp|avif|bmp|ico)$/.test(ext)) return FileImageIcon;
  if (/^(mp4|webm|mov|mkv)$/.test(ext)) return FileVideoIcon;
  if (/^(mp3|wav|ogg|m4a|flac|aac)$/.test(ext)) return FileAudioIcon;
  if (/^(zip|rar|7z|tar|gz)$/.test(ext)) return FileArchiveIcon;
  return FileTextIcon;
}

export default function FilesExplorer({ files, loading, uploading, busy, onPreview }) {
  const pending = loading || uploading || busy;
  return (
    <div id="d5FilesExplorer" className="hfv-explorer" data-animate-ui-files="radix" aria-label="Uploaded files" aria-busy={Boolean(pending)}>
      {pending && <div className="hfv-explorer-loading"><LoadingState label={uploading ? 'Uploading' : busy ? 'Opening file' : 'Loading files'} /></div>}
      <Files defaultOpen={['uploaded']}>
        <FolderItem value="uploaded">
          <FolderTrigger>Files</FolderTrigger>
          <FolderContent>
            <SubFiles>
              {files.map(file => (
                <FileItem key={file.id} icon={iconFor(file)} data-hfv-preview-id={file.id}
                  aria-label={'Preview ' + file.name} title={file.name} disabled={busy}
                  onClick={() => void onPreview(file)}>
                  {file.name}
                </FileItem>
              ))}
              {!files.length && <p className="hfv-explorer-empty">{loading ? 'Loading files…' : 'No files uploaded yet.'}</p>}
            </SubFiles>
          </FolderContent>
        </FolderItem>
      </Files>
    </div>
  );
}
