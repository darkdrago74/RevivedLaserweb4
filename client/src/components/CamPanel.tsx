
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import CamSettings from './CamSettings';
import GcodePreview from './GcodePreview';
import TestGeneratorPanel from './TestGeneratorPanel';
import MaterialsPanel from './MaterialsPanel';
import type { VectorOptions } from '../types';

interface CamPanelProps {
    onGenerate: (gcode: string) => void;
}

const CamPanel: React.FC<CamPanelProps> = ({ onGenerate }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(null);
    const [fileType, setFileType] = useState<'vector' | 'raster'>('vector');
    const [options, setOptions] = useState<VectorOptions | null>(null);
    const [gcode, setGcode] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'workspace' | 'materials' | 'generator'>('workspace');

    const handleFile = (name: string, content: string | File, type: 'vector' | 'raster') => {
        setFileName(name);
        setFileType(type);
        if (typeof content === 'string') {
            setFileContent(content);
        } else {
            console.log("Raster file loaded", name);
        }
    };

    const generateGcode = async () => {
        if (!fileContent || !options) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/cam/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: fileType,
                    fileContent: fileType === 'vector' ? fileContent : undefined,
                    options
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setGcode(data.gcode);
                onGenerate(data.gcode);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (e) {
            alert('Failed to generate: ' + (e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyMaterial = (mat: any) => {
        // Apply material settings to current options
        if (options) {
            setOptions({
                ...options,
                // fix type mismatch: VectorOptions uses specific keys
                cutRate: mat.speed,
                laserPower: mat.power,
                passes: mat.passes
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any); // temporary cast avoiding complexity
            setActiveTab('workspace');
        }
    };

    const handleTestGenerate = (code: string) => {
        setGcode(code);
        onGenerate(code);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                <button
                    onClick={() => setActiveTab('workspace')}
                    className={`px-4 py-2 rounded ${activeTab === 'workspace' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    Workspace
                </button>
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`px-4 py-2 rounded ${activeTab === 'materials' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    Library
                </button>
                <button
                    onClick={() => setActiveTab('generator')}
                    className={`px-4 py-2 rounded ${activeTab === 'generator' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    Test Generator
                </button>
            </div>

            {activeTab === 'workspace' && (
                <>
                    <FileUpload onFileLoaded={handleFile} />
                    {/* ... existing workspace content ... */}
                    {fileName && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
                            <div>
                                <CamSettings
                                    fileType={fileType}
                                    onOptionsChanged={setOptions}
                                />
                                <button
                                    onClick={generateGcode}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: loading ? '#555' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {loading ? 'Generating...' : 'Generate G-code'}
                                </button>
                            </div>

                            <div>
                                {gcode && <GcodePreview gcode={gcode} />}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'materials' && (
                <MaterialsPanel onSelect={applyMaterial} />
            )}

            {activeTab === 'generator' && (
                <TestGeneratorPanel onGenerate={handleTestGenerate} />
            )}

        </div>
    );
};

export default CamPanel;
