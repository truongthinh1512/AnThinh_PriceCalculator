import React from 'react';
import { Group, Path, Line, Circle, Rect } from 'react-konva';

const SquareEI3D = ({ x, y, scale = 1 }) => {
    // Basic Dimensions
    const EI_W = 160 * scale;
    const EI_H = 140 * scale;
    const EI_D = 100 * scale;

    // Isometric helper
    const iso = (x, y, z) => ({
        x: (x - y) * Math.cos(Math.PI / 6),
        y: (x + y) * Math.sin(Math.PI / 6) - z
    });
    
    const CORE_W = EI_W;       
    const CORE_D = EI_D;       
    const CORE_H = EI_H;       

    // Vertices needed for rendering
    // 1. The Core Stack
    // Top Face
    const t1 = iso(-CORE_W/2, -CORE_D/2, CORE_H);
    const t2 = iso(CORE_W/2, -CORE_D/2, CORE_H);
    const t3 = iso(CORE_W/2, CORE_D/2, CORE_H);
    const t4 = iso(-CORE_W/2, CORE_D/2, CORE_H);
    // Bottom Face
    const b2 = iso(CORE_W/2, -CORE_D/2, 0);
    const b3 = iso(CORE_W/2, CORE_D/2, 0);
    const b4 = iso(-CORE_W/2, CORE_D/2, 0);

    // 2. The Coil/Bobbin
    const COIL_W = CORE_W * 0.55; 
    const COIL_D = CORE_D * 1.3; // Bulges out more
    const COIL_H = CORE_H * 0.6;
    
    const c_z_base = (CORE_H - COIL_H) / 2;
    // Coil Top vertices
    const ct1 = iso(-COIL_W/2, -COIL_D/2, c_z_base + COIL_H);
    const ct2 = iso(COIL_W/2, -COIL_D/2, c_z_base + COIL_H);
    const ct3 = iso(COIL_W/2, COIL_D/2, c_z_base + COIL_H);
    const ct4 = iso(-COIL_W/2, COIL_D/2, c_z_base + COIL_H);
    // Coil Bottom vertices
    const cb3 = iso(COIL_W/2, COIL_D/2, c_z_base);
    const cb4 = iso(-COIL_W/2, COIL_D/2, c_z_base);
    const cb2 = iso(COIL_W/2, -COIL_D/2, c_z_base);

    // Mounting Bracket Feet Rendering
    const renderFoot = (xSign, ySign) => {
            const fx = xSign * (CORE_W/2 + 10);
            const fy = ySign * (CORE_D/2 - 15);
            const f_iso = iso(fx, fy, 0); // Foot tip
            
            // Base connection point
            const basePt = iso(xSign*CORE_W/2, fy, 0);

            return (
                <Group>
                    {/* Metal bracket arm */}
                    <Path 
                    data={`M ${iso(xSign*CORE_W/2, fy-10, 5).x} ${iso(xSign*CORE_W/2, fy-10, 5).y} 
                            L ${f_iso.x} ${f_iso.y} 
                            L ${iso(xSign*CORE_W/2, fy+10, 5).x} ${iso(xSign*CORE_W/2, fy+10, 5).y} Z`}
                    fill="#B0BEC5" stroke="#546E7A" strokeWidth={1}
                    />
                    {/* Hole */}
                    <Circle x={f_iso.x * 0.9} y={f_iso.y} radius={2} fill="#333" />
                </Group>
            );
    };

    return (
        <Group x={x} y={y + EI_H/3}>
                {/* Feet Back */}
                {renderFoot(1, -1)} 
                {renderFoot(-1, -1)}

                {/* --- CORE BODY --- */}
                {/* 1. Right Face (Lamination Stack Side) - NEEDS TEXTURE */}
                <Group>
                    <Path
                        data={`M ${t2.x} ${t2.y} L ${t3.x} ${t3.y} L ${b3.x} ${b3.y} L ${b2.x} ${b2.y} Z`}
                        fillLinearGradientStartPoint={{x: t2.x, y: t2.y}}
                        fillLinearGradientEndPoint={{x: b3.x, y: b3.y}}
                        fillLinearGradientColorStops={[0, '#424242', 0.5, '#757575', 1, '#212121']}
                        stroke="#212121"
                    />
                    {/* Detailed Lamination Lines */}
                    {Array.from({length: 15}).map((_, i) => {
                        const ratio = (i+1)/16;
                        const pStart = { x: t2.x + (t3.x-t2.x)*ratio, y: t2.y + (t3.y-t2.y)*ratio };
                        const pEnd = { x: b2.x + (b3.x-b2.x)*ratio, y: b2.y + (b3.y-b2.y)*ratio };
                        return <Line key={i} points={[pStart.x, pStart.y, pEnd.x, pEnd.y]} stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />;
                    })}
                </Group>

                {/* 2. Top Face (Solid Iron) */}
                <Path
                    data={`M ${t1.x} ${t1.y} L ${t2.x} ${t2.y} L ${t3.x} ${t3.y} L ${t4.x} ${t4.y} Z`}
                    fill="#9E9E9E" stroke="#616161"
                />
                
                {/* 3. Front Face (The E shape) using Gradient */}
                <Path
                    data={`M ${t4.x} ${t4.y} L ${t3.x} ${t3.y} L ${b3.x} ${b3.y} L ${b4.x} ${b4.y} Z`}
                    fillLinearGradientStartPoint={{x: t4.x, y: t4.y}}
                    fillLinearGradientEndPoint={{x: b3.x, y: b3.y}}
                    fillLinearGradientColorStops={[0, '#BDBDBD', 1, '#757575']}
                    stroke="#424242"
                />

                {/* --- COIL / BOBBIN --- */}
                {/* Side of Coil */}
                <Path
                    data={`M ${ct2.x} ${ct2.y} L ${ct3.x} ${ct3.y} L ${cb3.x} ${cb3.y} L ${cb2.x} ${cb2.y} Z`}
                    fill="#3E2723" // Dark copper/insulation
                    stroke="#000"
                />
                
                {/* Front Face of Coil - With Texture */}
                <Group>
                    <Path
                        data={`M ${ct4.x} ${ct4.y} L ${ct3.x} ${ct3.y} L ${cb3.x} ${cb3.y} L ${cb4.x} ${cb4.y} Z`}
                        fill="#5D4037" // Lighter copper
                        stroke="#000"
                    />
                    {/* Winding Lines */}
                    {Array.from({length: 8}).map((_, i) => {
                        const yOff = (i * (COIL_H/8)); // Approximate
                        // Just simple horizontal lines across the iso face? 
                        // It's tricky in 2D iso, let's just draw some lines parallel to top edge
                        return (
                            <Line 
                                key={i}
                                points={[ct4.x, ct4.y + yOff + 10, ct3.x, ct3.y + yOff + 10]}
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth={1}
                            />
                        )
                    })}
                </Group>

                {/* Top of Coil */}
                <Path
                    data={`M ${ct1.x} ${ct1.y} L ${ct2.x} ${ct2.y} L ${ct3.x} ${ct3.y} L ${ct4.x} ${ct4.y} Z`}
                    fill="#4E342E" stroke="#000"
                />
                
                {/* Yellow Insulation Tape Band */}
                <Path
                    data={`M ${iso(-COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 + 8).x} ${iso(-COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 + 8).y} 
                        L ${iso(COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 + 8).x} ${iso(COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 + 8).y}
                        L ${iso(COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 - 8).x} ${iso(COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 - 8).y}
                        L ${iso(-COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 - 8).x} ${iso(-COIL_W/2, COIL_D/2, c_z_base + COIL_H/2 - 8).y} Z`}
                    fill="#FFEB3B" 
                    opacity={0.9}
                    stroke="#FBC02D"
                />

                {/* Bolts on Core (Front) */}
                <Circle x={iso(CORE_W/2 - 10, CORE_D/2, CORE_H - 10).x} y={iso(CORE_W/2 - 10, CORE_D/2, CORE_H - 10).y} radius={3} fill="#555" />
                <Circle x={iso(-CORE_W/2 + 10, CORE_D/2, CORE_H - 10).x} y={iso(-CORE_W/2 + 10, CORE_D/2, CORE_H - 10).y} radius={3} fill="#555" />
                <Circle x={iso(CORE_W/2 - 10, CORE_D/2, 10).x} y={iso(CORE_W/2 - 10, CORE_D/2, 10).y} radius={3} fill="#555" />
                <Circle x={iso(-CORE_W/2 + 10, CORE_D/2, 10).x} y={iso(-CORE_W/2 + 10, CORE_D/2, 10).y} radius={3} fill="#555" />

                {/* Feet Front */}
                {renderFoot(1, 1)}
                {renderFoot(-1, 1)}
        </Group>
    );
};

export default SquareEI3D;