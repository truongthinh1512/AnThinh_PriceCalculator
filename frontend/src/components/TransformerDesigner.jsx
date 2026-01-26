import React, { useRef } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Path } from 'react-konva';
import jsPDF from 'jspdf';

// Import 3D Components
import Toroid3D from './Toroid3D';
import SquareEI3D from './SquareEI3D';

// --- CONFIG ---
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 800;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2 - 100;

const TransformerDesigner = ({ transformerData, drawingConfig, onConfigChange, readOnly = false }) => {
    const stageRef = useRef(null);

    // Filter windings
    const primaryWindings = transformerData.windings?.filter(w => w.type === 'PRIMARY') || [];
    const secondaryWindings = transformerData.windings?.filter(w => w.type === 'SECONDARY') || [];
    
    // Core Dimensions based on weight
    const weight = parseFloat(transformerData.coreWeight || 1);
    const scale = Math.min(Math.max(weight * 0.1, 0.8), 2.5); // Clamp scale logic
    
    const TOROID_RX = 140 * scale; 
    const TOROID_RY = 70 * scale; 
    const TOROID_HEIGHT = 90 * scale; 

    // EI Dimensions for wire calculations
    const EI_W = 160 * scale;
    const EI_H = 140 * scale;

    const handleExportPdf = () => {
        if (!stageRef.current) return;
        const stage = stageRef.current;
        const pdf = new jsPDF('l', 'px', [stage.width(), stage.height()]);
        const imgData = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.95 }); 
        pdf.addImage(imgData, 'JPEG', 0, 0, stage.width(), stage.height());
        pdf.save(`${transformerData.name || 'drawing'}.pdf`);
    };

    /**
     * Draw wires dynamically
     */
    const renderWires = () => {
        const isTron = transformerData.type === 'TRON';
        
        return (
            <>
                {/* --- PRIMARY (Left Exit) --- */}
                {primaryWindings.map((w, i) => {
                    const angleDeg = 160 + (i * 10);
                    const angleRad = (angleDeg * Math.PI) / 180;
                    
                    // Exit point on Toroid surface
                    const startX = CENTER_X + (isTron ? (TOROID_RX * 0.9 * Math.cos(angleRad)) : -EI_W/2);
                    const startY = (CENTER_Y + (isTron ? 0 : EI_H/3)) + (isTron ? (TOROID_RY * 0.9 * Math.sin(angleRad)) + TOROID_HEIGHT/2 : EI_H/2);
                    
                    // Destination point (Far Left)
                    const endX = CENTER_X - 250; 
                    const endY = CENTER_Y + (i - (primaryWindings.length-1)/2) * 50;
                    // ... (rest of wire code)

                    const cp1x = startX - 80;
                    const cp1y = startY + 50;
                    const cp2x = endX + 80;
                    const cp2y = endY;

                    return (
                        <Group key={`pri-${i}`}>
                            {/* Wire Shadow */}
                            <Path 
                                data={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={6}
                                x={5} y={5}
                            />
                            {/* Wire Main Body */}
                            <Path 
                                data={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                                stroke={w.color === 'yellow' ? '#FFD600' : 'red'} // Vivid yellow
                                strokeWidth={4}
                                lineCap="round"
                                lineJoin="round"
                            />
                            
                            {/* Connector (White Block) */}
                            <Group x={endX - 25} y={endY - 10}>
                                <Rect width={25} height={20} fill="#F5F5F5" stroke="#999" cornerRadius={2} shadowBlur={2} />
                                {/* Pins */}
                                <Rect x={2} y={5} width={4} height={10} fill="#ccc" />
                                <Rect x={8} y={5} width={4} height={10} fill="#ccc" />
                                <Rect x={14} y={5} width={4} height={10} fill="#ccc" />
                            </Group>
                            
                            {/* Label */}
                            <Text 
                                text={w.description || "Primary"} 
                                x={endX - 130} 
                                y={endY - 5} 
                                fontSize={14} 
                                fill="white"
                                fontStyle="bold"
                                align="right"
                                width={100}
                            />
                             <Text 
                                text={`(${w.voltage}V)`} 
                                x={endX - 130} 
                                y={endY + 10} 
                                fontSize={11} 
                                fill="#aaa"
                                align="right"
                                width={100}
                            />
                        </Group>
                    );
                })}

                {/* --- SECONDARY (Right Exit - Bundled) --- */}
                {secondaryWindings.map((w, i) => {
                    // Try to bundle: 
                    // Start closer together on the body
                    const angleDeg = 20 - (i * 8); // Fan slightly right
                    const angleRad = (angleDeg * Math.PI) / 180;

                    const startX = CENTER_X + (isTron ? (TOROID_RX * 0.95 * Math.cos(angleRad)) : EI_W/2);
                    const startY = (CENTER_Y - 50) + (isTron ? (TOROID_RY * 0.95 * Math.sin(angleRad)) + TOROID_HEIGHT/2 : EI_H/2);

                    const endX = CENTER_X + 220;
                    const endY = CENTER_Y + (i - (secondaryWindings.length-1)/2) * 40;

                    const cp1x = startX + 60;
                    const cp1y = startY + 60; // Droop down first
                    const cp2x = endX - 60;
                    const cp2y = endY;
                    
                    const wireColor = w.color || ['#D32F2F', '#1976D2', '#388E3C', '#F57C00'][i % 4];

                    return (
                        <Group key={`sec-${i}`}>
                             {/* Wire Shadow */}
                            <Path 
                                data={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={6}
                                x={5} y={5}
                            />
                             {/* Wire */}
                             <Path 
                                data={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                                stroke={wireColor}
                                strokeWidth={4}
                                lineCap="round"
                            />
                            
                            {/* Connector (White Block) */}
                            <Group x={endX} y={endY - 10}>
                                <Rect width={30} height={20} fill="#F5F5F5" stroke="#999" cornerRadius={2} shadowBlur={2} />
                                <Rect x={5} y={5} width={4} height={10} fill="#ccc" />
                                <Rect x={13} y={5} width={4} height={10} fill="#ccc" />
                                <Rect x={21} y={5} width={4} height={10} fill="#ccc" />
                            </Group>
                            
                            {/* Description */}
                            <Text 
                                text={`${w.voltage}V / ${w.current || '?'}A`} 
                                x={endX + 35} 
                                y={endY - 7} 
                                fontSize={14} 
                                fill="white"
                                fontStyle="bold"
                            />
                             <Text 
                                text={w.description || "Secondary"} 
                                x={endX + 35} 
                                y={endY + 8} 
                                fontSize={10} 
                                fill="#ccc"
                            />
                        </Group>
                    );
                })}
            </>
        );
    };

    /**
     * Draw specification table at bottom
     */
    const renderSpecTable = () => {
        const TABLE_START_Y = CANVAS_HEIGHT - 250;
        const ROW_H = 30;
        const COLS = [
            { header: "Số Vol (V)", x: 50, w: 150 },
            { header: "Dây quấn (Type/Size)", x: 200, w: 250 },
            { header: "Ra Dây (Description)", x: 450, w: 300 },
            { header: "Note", x: 750, w: 200 }
        ];

        // Combined windings list
        const allWindings = [...primaryWindings, ...secondaryWindings];
        const displayData = allWindings.length > 0 ? allWindings : [{voltage: '---', type: '---', description: '---'}];

        return (
            <Group>
                {/* Table Title Bar */}
                <Rect x={50} y={TABLE_START_Y - 40} width={CANVAS_WIDTH - 100} height={40} fill="transparent" stroke="white" strokeWidth={1} />
                <Text 
                    text={`QUI CÁCH: ${transformerData.type === 'TRON' ? 'TRÒN' : 'EI'} - Weight: ${transformerData.coreWeight || '?'} Kg`} 
                    x={CANVAS_WIDTH/2} y={TABLE_START_Y - 15} 
                    fontSize={16} fill="white" fontStyle="bold" align="center" offsetX={200} // Centered roughly
                />

                {/* Header Row */}
                <Rect x={50} y={TABLE_START_Y} width={CANVAS_WIDTH - 100} height={ROW_H} fill="#37474F" stroke="white" strokeWidth={1} />
                {COLS.map((col, i) => (
                    <Text key={i} text={col.header} x={col.x + 10} y={TABLE_START_Y + 20} fontSize={14} fill="white" fontStyle="bold" />
                ))}

                {/* Data Rows */}
                {displayData.map((w, i) => {
                    const y = TABLE_START_Y + ROW_H + (i * ROW_H);
                    return (
                        <Group key={i}>
                            <Rect x={50} y={y - ROW_H} width={CANVAS_WIDTH - 100} height={ROW_H} stroke="white" strokeWidth={1} />
                            
                            {/* Vertical Dividers */}
                            <Line points={[COLS[1].x, y-ROW_H, COLS[1].x, y]} stroke="white" strokeWidth={1} />
                            <Line points={[COLS[2].x, y-ROW_H, COLS[2].x, y]} stroke="white" strokeWidth={1} />
                            <Line points={[COLS[3].x, y-ROW_H, COLS[3].x, y]} stroke="white" strokeWidth={1} />

                            {/* Cell Text */}
                            <Text text={`${w.voltage || '0'}V`} x={COLS[0].x + 10} y={y - 10} fontSize={14} fill="white" />
                            <Text text={`${w.specId ? 'ĐỒNG' : '?'} ${w.specId || ''} (${w.type === 'PRIMARY' ? 'Pri' : 'Sec'})`} x={COLS[1].x + 10} y={y - 10} fontSize={14} fill="white" />
                            <Text text={w.description || '...'} x={COLS[2].x + 10} y={y - 10} fontSize={14} fill="white" />
                            <Text text={i === 0 ? "MỘT ĐẦU ỐC" : (i === 1 ? "CÓ PFE CHỐNG NHIỄU" : "")} x={COLS[3].x + 10} y={y - 10} fontSize={12} fill="#B0BEC5" />
                        </Group>
                    );
                })}
            </Group>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Header/Tools Overlay */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button 
                    onClick={handleExportPdf}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow flex items-center gap-2"
                 >
                     <span>Export PDF Datasheet</span>
                 </button>
            </div>
            
            <div className="flex-1 overflow-auto flex justify-center items-center bg-gray-800 p-4">
                 <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef} className="shadow-2xl">
                    <Layer>
                        {/* 0. Main Dark Background (For PDF Export) */}
                        <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a202c" />

                        {/* 1. Header Info */}
                        <Text 
                            text="SƠ ĐỒ RA DÂY" 
                            x={50} y={50} 
                            fontSize={24} fill="white" fontFamily="Arial" 
                        />
                         <Text 
                            text={`KHÁCH HÀNG: ${(readOnly ? transformerData.customerName : '') || "..."}`.toUpperCase()} 
                            x={50} y={80} 
                            fontSize={28} fill="white" fontFamily="Arial" fontStyle="bold"
                        />
                        
                        <Text 
                            text={`Ngày ${new Date().getDate()} / ${new Date().getMonth() + 1} / ${new Date().getFullYear()}`}
                            x={CANVAS_WIDTH - 250} y={50} 
                            fontSize={24} fill="white" fontFamily="Arial" 
                        />

                        {/* Main 3D Object - Using New Components */}
                        {transformerData.type === 'TRON' ? (
                            <Toroid3D 
                                x={CENTER_X} 
                                y={CENTER_Y} // Standard Position
                                scale={1}    // Fixed Scale as requested
                            />
                        ) : (
                            <SquareEI3D 
                                x={CENTER_X} 
                                y={CENTER_Y}
                                scale={scale}
                            />
                        )}
                        
                        {/* 2.5 Big Product Title */}
                        <Text 
                            text={`${transformerData.name || "550T TRÒN ĐỒNG"}`.toUpperCase()}
                            x={CENTER_X} y={CENTER_Y + TOROID_RX + 80}
                            fontSize={36} fill="white" fontStyle="bold" align="center"
                            offsetX={150} // Rough centering
                        />

                        {/* 3. Wires & Labels */}
                        {renderWires()}

                        {/* 4. Spec Table */}
                        {renderSpecTable()}

                    </Layer>
                 </Stage>
            </div>
        </div>
    );
};

export default TransformerDesigner;
