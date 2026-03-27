import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';

export const PartNode = ({ data }: { data: any }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [localData, setLocalData] = useState({
    label: data.label || '',
    repere: data.repere || '',
    qte: data.qte || 1
  });

  useEffect(() => {
    setLocalData({
      label: data.label || '',
      repere: data.repere || '',
      qte: data.qte || 1
    });
  }, [data.label, data.repere, data.qte]);

  const handleBlur = () => {
    setIsEditing(null);
    if (data.onChange) {
      data.onChange(localData);
    }
  };

  const updateField = (field: string, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-slate-800 min-w-[160px] group relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDelete) data.onDelete();
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
      >
        <X size={12} />
      </button>
      <div className="flex flex-col">
        {isEditing === 'label' ? (
          <input
            autoFocus
            className="text-sm font-bold text-slate-900 uppercase bg-slate-50 border border-slate-200 rounded px-1 w-full focus:outline-none"
            value={localData.label}
            onChange={(e) => updateField('label', e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          />
        ) : (
          <div 
            className="text-sm font-bold text-slate-900 uppercase cursor-pointer hover:bg-slate-100 px-1 rounded truncate"
            onClick={() => setIsEditing('label')}
          >
            {localData.label || 'SANS NOM'}
          </div>
        )}

        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1">
            <span>Réf:</span>
            {isEditing === 'repere' ? (
              <input
                autoFocus
                className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 w-16 focus:outline-none"
                value={localData.repere}
                onChange={(e) => updateField('repere', e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-slate-100 px-1 rounded"
                onClick={() => setIsEditing('repere')}
              >
                {localData.repere || '-'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-slate-100 px-1 rounded flex items-center gap-1">
              Qté:
              {isEditing === 'qte' ? (
                <input
                  autoFocus
                  type="number"
                  className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded px-1 w-8 focus:outline-none"
                  value={localData.qte}
                  onChange={(e) => updateField('qte', parseInt(e.target.value) || 1)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                />
              ) : (
                <span 
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded"
                  onClick={() => setIsEditing('qte')}
                >
                  {localData.qte}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-800" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-800" />
    </div>
  );
};

export const OperationNode = ({ data }: { data: any }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [localData, setLocalData] = useState({
    label: data.label || 'ASSEMBLAGE',
    method: data.method || 'OPÉRATION',
    qte: data.qte || 1
  });

  useEffect(() => {
    setLocalData({
      label: data.label || 'ASSEMBLAGE',
      method: data.method || 'OPÉRATION',
      qte: data.qte || 1
    });
  }, [data.label, data.method, data.qte]);

  const handleBlur = () => {
    setIsEditing(null);
    if (data.onChange) {
      data.onChange(localData);
    }
  };

  const updateField = (field: string, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-orange-50 border-2 border-orange-600 min-w-[160px] group relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDelete) data.onDelete();
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
      >
        <X size={12} />
      </button>
      <div className="flex flex-col">
        {isEditing === 'label' ? (
          <input
            autoFocus
            className="text-sm font-bold text-orange-900 uppercase bg-white border border-orange-200 rounded px-1 w-full focus:outline-none"
            value={localData.label}
            onChange={(e) => updateField('label', e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          />
        ) : (
          <div 
            className="text-sm font-bold text-orange-900 uppercase cursor-pointer hover:bg-orange-100 px-1 rounded truncate"
            onClick={() => setIsEditing('label')}
          >
            {localData.label}
          </div>
        )}

        <div className="flex justify-between items-center mt-1 text-[10px] text-orange-700 font-mono">
          <div className="flex items-center gap-1">
            {isEditing === 'method' ? (
              <input
                autoFocus
                className="text-[10px] font-mono text-orange-700 bg-white border border-orange-200 rounded px-1 w-20 focus:outline-none"
                value={localData.method}
                onChange={(e) => updateField('method', e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              />
            ) : (
              <span 
                className="cursor-pointer hover:bg-orange-100 px-1 rounded"
                onClick={() => setIsEditing('method')}
              >
                {localData.method}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-orange-100 px-1 rounded flex items-center gap-1">
              Qté:
              {isEditing === 'qte' ? (
                <input
                  autoFocus
                  type="number"
                  className="text-[10px] font-mono text-orange-700 bg-white border border-orange-200 rounded px-1 w-8 focus:outline-none"
                  value={localData.qte}
                  onChange={(e) => updateField('qte', parseInt(e.target.value) || 1)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                />
              ) : (
                <span 
                  className="cursor-pointer hover:bg-orange-200 px-1 rounded"
                  onClick={() => setIsEditing('qte')}
                >
                  {localData.qte}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-orange-600" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-orange-600" />
    </div>
  );
};
