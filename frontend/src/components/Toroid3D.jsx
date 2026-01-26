import React, { useEffect, useState } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';

const Toroid3D = ({ x, y, scale = 1, src = '/assets/BienApTron.png' }) => {
    const [image, setImage] = useState(null);

    useEffect(() => {
        const img = new window.Image();
        img.src = src;
        img.onload = () => setImage(img);
    }, [src]);

    if (!image) {
        return <Group x={x} y={y} />;
    }

    const width = image.width * scale;
    const height = image.height * scale;

    return (
        <Group x={x} y={y}>
            <KonvaImage
                image={image}
                x={-width / 2}
                y={-height / 2}
                width={width}
                height={height}
            />
        </Group>
    );
};

export default Toroid3D;
