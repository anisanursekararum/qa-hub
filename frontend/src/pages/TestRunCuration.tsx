import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Navbar from '../components/Navbar';

// Type definitions to represent Prisma schema entities in frontend
interface TestCase {
  id: string;
  title: string;
  steps: string[];
  hasAutomation: boolean;
  status: 'DRAFT' | 'READY';
  author: string;
}

interface CartItem {
  id: string;
  testCase: TestCase;
  executionStatus: 'TO_DO' | 'PASSED' | 'FAILED';
  retryCount: number;
}

type RunStatus = 'DRAFT' | 'IN_PROGRESS' | 'AUTOMATION_RUNNING' | 'DONE';

export const TestRunCuration: React.FC = () => {
  // 1. Initial Mock Warehouse Test Repository (filtered by READY status)
  const [warehouseCases, setWarehouseCases] = useState<TestCase[]>([
    {
      id: 'tc-101',
      title: 'Verify ERPNext customer registration pipeline with secure OTP verification',
      steps: ['Navigate to registration', 'Fill OTP values', 'Assert registration success'],
      hasAutomation: true,
      status: 'READY',
      author: 'Alex Johnson',
    },
    {
      id: 'tc-102',
      title: 'Ensure payment gateway handles transaction timeouts and logs failures',
      steps: ['Select item', 'Checkout with MockGateway', 'Assert timeout fallback error log'],
      hasAutomation: true,
      status: 'READY',
      author: 'Maria Garcia',
    },
    {
      id: 'tc-103',
      title: 'Test user session expiration limits are strictly kept at 15 minutes',
      steps: ['Login profile', 'Idle for 15 minutes', 'Assert redirect to access gateway'],
      hasAutomation: false,
      status: 'READY',
      author: 'Alex Johnson',
    },
    {
      id: 'tc-104',
      title: 'Validate multi-project workspace switching returns clean tenant context',
      steps: ['Create project A', 'Create project B', 'Assert tenant isolation filters'],
      hasAutomation: true,
      status: 'READY',
      author: 'Devon Patel',
    },
    {
      id: 'tc-105',
      title: 'Check CSV test case import parses JSON steps without syntax warnings',
      steps: ['Select CSV upload', 'Attach test_scenarios.csv', 'Confirm review gate holds draft'],
      hasAutomation: false,
      status: 'READY',
      author: 'Maria Garcia',
    },
  ]);

  // 2. Active Test Run States
  const [runName, setRunName] = useState('Release Regression Run - v2.4.0');
  const [runStatus, setRunStatus] = useState<RunStatus>('DRAFT');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 3. Batch selection checkboxes state
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);

  // 4. State for active automation running simulation
  const [activeExecutingCaseId, setActiveExecutingCaseId] = useState<string | null>(null);

  // Check if Concurrency Lock is active (IN_PROGRESS or AUTOMATION_RUNNING blocks editing)
  const isConcurrencyLockActive = runStatus === 'IN_PROGRESS' || runStatus === 'AUTOMATION_RUNNING';

  // Toggle checkbox selection in warehouse
  const handleWarehouseCheckboxToggle = (id: string) => {
    if (isConcurrencyLockActive) return;
    setSelectedWarehouseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Toggle checkbox selection in cart
  const handleCartCheckboxToggle = (id: string) => {
    if (isConcurrencyLockActive) return;
    setSelectedCartIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Batch add selected items to Cart
  const handleBatchAddToCart = () => {
    if (isConcurrencyLockActive || selectedWarehouseIds.length === 0) return;

    const itemsToAdd = warehouseCases.filter((item) => selectedWarehouseIds.includes(item.id));
    const newCartItems = itemsToAdd.map((tc) => ({
      id: `item-${tc.id}`,
      testCase: tc,
      executionStatus: 'TO_DO' as const,
      retryCount: 0,
    }));

    // Add unique items
    setCartItems((prev) => {
      const filteredPrev = prev.filter((item) => !selectedWarehouseIds.includes(item.testCase.id));
      return [...filteredPrev, ...newCartItems];
    });

    // Remove from Warehouse representation
    setWarehouseCases((prev) => prev.filter((item) => !selectedWarehouseIds.includes(item.id)));
    setSelectedWarehouseIds([]);
  };

  // Batch remove selected items from Cart
  const handleBatchRemoveFromCart = () => {
    if (isConcurrencyLockActive || selectedCartIds.length === 0) return;

    const itemsToRemove = cartItems.filter((item) => selectedCartIds.includes(item.id));
    const returnedTestCases = itemsToRemove.map((item) => item.testCase);

    setWarehouseCases((prev) => [...prev, ...returnedTestCases]);
    setCartItems((prev) => prev.filter((item) => !selectedCartIds.includes(item.id)));
    setSelectedCartIds([]);
  };

  // Drag and Drop implementation using hello-pangea/dnd
  const handleOnDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Reject if dropped outside or concurrency lock is active
    if (!destination || isConcurrencyLockActive) return;

    // Item dropped in the same panel (reordering)
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'warehouse') {
        const reordered = Array.from(warehouseCases);
        const [removed] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, removed);
        setWarehouseCases(reordered);
      } else if (source.droppableId === 'cart') {
        const reordered = Array.from(cartItems);
        const [removed] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, removed);
        setCartItems(reordered);
      }
      return;
    }

    // Moving between panels: Warehouse -> Cart
    if (source.droppableId === 'warehouse' && destination.droppableId === 'cart') {
      const sourceList = Array.from(warehouseCases);
      const [removedCase] = sourceList.splice(source.index, 1);

      const newItem: CartItem = {
        id: `item-${removedCase.id}`,
        testCase: removedCase,
        executionStatus: 'TO_DO',
        retryCount: 0,
      };

      const destList = Array.from(cartItems);
      destList.splice(destination.index, 0, newItem);

      setWarehouseCases(sourceList);
      setCartItems(destList);
      
      // Clean selection
      setSelectedWarehouseIds((prev) => prev.filter((id) => id !== removedCase.id));
    }

    // Moving between panels: Cart -> Warehouse
    if (source.droppableId === 'cart' && destination.droppableId === 'warehouse') {
      const sourceList = Array.from(cartItems);
      const [removedItem] = sourceList.splice(source.index, 1);

      const destList = Array.from(warehouseCases);
      destList.splice(destination.index, 0, removedItem.testCase);

      setCartItems(sourceList);
      setWarehouseCases(destList);

      // Clean selection
      setSelectedCartIds((prev) => prev.filter((id) => id !== removedItem.id));
    }
  };

  // Simulates Mutex locking and Webhooks streams
  const handleTriggerAutomation = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one test case to the Cart before running.');
      return;
    }

    setRunStatus('AUTOMATION_RUNNING');

    // Simulate Bitbucket Pipeling headless Playwright runs and webhook telemetry stream back to UI
    for (let i = 0; i < cartItems.length; i++) {
      const activeItem = cartItems[i];
      if (!activeItem.testCase.hasAutomation) continue;

      setActiveExecutingCaseId(activeItem.id);
      
      // Simulating execution telemetry delay (Playwright container tests)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Resolve result: 80% pass rate, else failed triggers auto-retry
      const outcome = Math.random() > 0.2 ? 'PASSED' : 'FAILED';

      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === activeItem.id) {
            return {
              ...item,
              executionStatus: outcome,
              retryCount: outcome === 'FAILED' ? 1 : 0, // Auto-retry simulation
            };
          }
          return item;
        }),
      );
    }

    setActiveExecutingCaseId(null);
    setRunStatus('IN_PROGRESS'); // return back to standard progress to allow manual completions
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#161616] text-[#161616] dark:text-[#E0E0E0] flex flex-col transition-colors duration-200">
      <Navbar currentPath="/runs" user={{ name: 'Alex Johnson', email: 'alex.j@company.com' }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-4">
        
        {/* Upper Dashboard Status Control Panel */}
        <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D]">TEST_RUN_ID: tr-8804-x</span>
              <span className="inline-block w-1.5 h-1.5 bg-[#CCCCCC] dark:bg-[#393939] rounded-full"></span>
              {/* Dynamic status badge pill */}
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E0E0E0]/20 text-[#525252] dark:text-[#E0E0E0] text-[10px] font-mono font-bold tracking-tight">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  runStatus === 'DRAFT' ? 'bg-gray-400' :
                  runStatus === 'IN_PROGRESS' ? 'bg-[#0F62FE]' :
                  runStatus === 'AUTOMATION_RUNNING' ? 'bg-[#8A3FFC] animate-pulse' : 'bg-[#198038]'
                }`}></span>
                {runStatus}
              </div>
            </div>
            <input
              type="text"
              value={runName}
              disabled={isConcurrencyLockActive}
              onChange={(e) => setRunName(e.target.value)}
              className="mt-1 font-sans font-bold text-lg text-[#161616] dark:text-white bg-transparent border-b border-transparent hover:border-[#CCCCCC] dark:hover:border-[#393939] focus:border-[#0F62FE] focus:outline-none w-full max-w-md transition-colors duration-150 disabled:opacity-80"
            />
          </div>

          {/* Trigger State Mutation Controls */}
          <div className="flex items-center space-x-2">
            {runStatus === 'DRAFT' && (
              <button
                onClick={() => setRunStatus('IN_PROGRESS')}
                className="px-3.5 py-1.5 font-sans font-bold text-xs bg-[#0F62FE] hover:bg-[#0353E9] text-white rounded-[4px] transition-colors duration-150"
              >
                Activate execution
              </button>
            )}

            {runStatus === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={handleTriggerAutomation}
                  className="px-3.5 py-1.5 font-sans font-bold text-xs bg-[#8A3FFC] hover:bg-[#7c30eb] text-white rounded-[4px] flex items-center transition-colors duration-150"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Execute with Automation
                </button>
                <button
                  onClick={() => setRunStatus('DONE')}
                  className="px-3.5 py-1.5 font-sans font-bold text-xs bg-[#198038] hover:bg-[#146b2e] text-white rounded-[4px] transition-colors duration-150"
                >
                  Done & Sign-Off
                </button>
              </>
            )}

            {runStatus === 'AUTOMATION_RUNNING' && (
              <div className="flex items-center space-x-2 font-mono text-[11px] text-[#8A3FFC] bg-[#8A3FFC]/10 border border-[#8A3FFC]/30 px-3 py-1.5 rounded-[4px]">
                <svg className="animate-spin h-3.5 w-3.5 text-[#8A3FFC]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>AUTOMATION PIPELINE STREAMING...</span>
              </div>
            )}

            {runStatus === 'DONE' && (
              <button
                onClick={() => {
                  setRunStatus('DRAFT');
                  setCartItems([]);
                  setWarehouseCases([
                    { id: 'tc-101', title: 'Verify ERPNext customer registration pipeline with secure OTP verification', steps: [], hasAutomation: true, status: 'READY', author: 'Alex Johnson' },
                    { id: 'tc-102', title: 'Ensure payment gateway handles transaction timeouts and logs failures', steps: [], hasAutomation: true, status: 'READY', author: 'Maria Garcia' },
                    { id: 'tc-103', title: 'Test user session expiration limits are strictly kept at 15 minutes', steps: [], hasAutomation: false, status: 'READY', author: 'Alex Johnson' },
                    { id: 'tc-104', title: 'Validate multi-project workspace switching returns clean tenant context', steps: [], hasAutomation: true, status: 'READY', author: 'Devon Patel' },
                    { id: 'tc-105', title: 'Check CSV test case import parses JSON steps without syntax warnings', steps: [], hasAutomation: false, status: 'READY', author: 'Maria Garcia' },
                  ]);
                }}
                className="px-3.5 py-1.5 font-sans font-bold text-xs border border-[#CCCCCC] dark:border-[#393939] hover:bg-[#F4F4F4] dark:hover:bg-[#1C1C21] text-[#161616] dark:text-[#E0E0E0] rounded-[4px] transition-colors duration-150"
              >
                Reset Curation Sandbox
              </button>
            )}
          </div>
        </div>

        {/* Multi-member Concurrency Alert Banner */}
        {isConcurrencyLockActive && (
          <div className="p-3 bg-[#8A3FFC]/10 border border-[#8A3FFC]/30 rounded-[4px] flex items-center justify-between text-xs font-sans text-[#8A3FFC] transition-all duration-300">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8A3FFC] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8A3FFC]"></span>
              </span>
              <span>
                <strong>MUTEX_LOCK CONCURRENCY CONFLICT PREVENTED:</strong> Manual curation features are read-only for all connected engineers while execution runs are active.
              </span>
            </div>
            <span className="font-mono text-[9px] border border-[#8A3FFC] px-1.5 py-0.5 rounded bg-[#8A3FFC]/10">WebSocket Lock Active</span>
          </div>
        )}

        {/* Drag and Drop Context split panels */}
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* LEFT PANEL: Warehouse Test Repository */}
            <div className="flex flex-col bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden transition-all duration-200">
              <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#FAFAFA] dark:bg-[#19191E]">
                <div>
                  <h3 className="font-sans font-bold text-sm text-[#161616] dark:text-white">Warehouse Repository</h3>
                  <p className="font-sans text-[11px] text-[#757575] dark:text-[#8D8D8D] mt-0.5">Showing verified cases with READY status.</p>
                </div>
                {!isConcurrencyLockActive && warehouseCases.length > 0 && (
                  <button
                    onClick={handleBatchAddToCart}
                    disabled={selectedWarehouseIds.length === 0}
                    className="px-2.5 py-1.5 font-sans font-bold text-[10px] bg-[#0F62FE] hover:bg-[#0353E9] text-white rounded-[4px] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add selected ({selectedWarehouseIds.length})
                  </button>
                )}
              </div>

              <Droppable droppableId="warehouse" isDropDisabled={isConcurrencyLockActive}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 space-y-2.5 min-h-[350px] overflow-y-auto transition-all duration-150 ${
                      snapshot.isDraggingOver ? 'bg-[#FAFAFA] dark:bg-[#1B1B20]' : ''
                    } ${isConcurrencyLockActive ? 'opacity-40 bg-gray-50/50 dark:bg-zinc-900/10 cursor-not-allowed' : ''}`}
                  >
                    {warehouseCases.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6">
                        <svg className="w-10 h-10 text-[#CCCCCC] dark:text-[#393939] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8]">Repository is empty or all items added to active Test Run.</p>
                      </div>
                    ) : (
                      warehouseCases.map((tc, index) => (
                        <Draggable key={tc.id} draggableId={tc.id} index={index} isDragDisabled={isConcurrencyLockActive}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`flex items-start p-3 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] bg-white dark:bg-[#161616] transition-all duration-150 ${
                                dragSnapshot.isDragging ? 'border-[#0F62FE] ring-1 ring-[#0F62FE]' : 'hover:border-[#A8A8A8] dark:hover:border-[#393939]'
                              }`}
                            >
                              {/* Batch Checkbox */}
                              <div className="pt-0.5 pr-2.5">
                                <input
                                  type="checkbox"
                                  checked={selectedWarehouseIds.includes(tc.id)}
                                  disabled={isConcurrencyLockActive}
                                  onChange={() => handleWarehouseCheckboxToggle(tc.id)}
                                  className="w-3.5 h-3.5 border border-[#CCCCCC] dark:border-[#393939] rounded-[2px] bg-white dark:bg-[#1C1C21] text-[#0F62FE] focus:ring-offset-0 focus:ring-[#0F62FE] cursor-pointer disabled:cursor-not-allowed"
                                />
                              </div>

                              {/* Drag Handle Indicator */}
                              <div
                                {...dragProvided.dragHandleProps}
                                className={`pt-1 pr-2 text-gray-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing ${
                                  isConcurrencyLockActive ? 'pointer-events-none' : ''
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M7 2a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm6-12a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2z" />
                                </svg>
                              </div>

                              {/* Case Info details */}
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="font-mono text-[9px] font-bold text-[#8A3FFC] bg-[#8A3FFC]/10 border border-[#8A3FFC]/30 px-1.5 py-0.5 rounded-[2px] uppercase">
                                  {tc.id}
                                </span>
                                <h4 className="font-sans font-semibold text-xs text-[#161616] dark:text-white mt-1.5 leading-normal">
                                  {tc.title}
                                </h4>
                                <div className="flex items-center space-x-2.5 mt-2">
                                  <span className="font-sans text-[10px] text-[#757575] dark:text-[#8D8D8D]">
                                    Author: <strong className="font-semibold">{tc.author}</strong>
                                  </span>
                                  <span className="inline-block w-1 h-1 bg-[#CCCCCC] dark:bg-[#393939] rounded-full"></span>
                                  <span className="font-sans text-[10px] text-[#757575] dark:text-[#8D8D8D] flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    Automation: {tc.hasAutomation ? <span className="text-[#0F62FE] ml-0.5 font-bold">ACTIVE</span> : <span className="text-gray-400 ml-0.5">NONE</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* RIGHT PANEL: Test Run Cart panel */}
            <div className="flex flex-col bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden transition-all duration-200">
              <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#FAFAFA] dark:bg-[#19191E]">
                <div>
                  <h3 className="font-sans font-bold text-sm text-[#161616] dark:text-white">Test Run Cart Curation</h3>
                  <p className="font-sans text-[11px] text-[#757575] dark:text-[#8D8D8D] mt-0.5">Scoping target list to prevent repository redundancy.</p>
                </div>
                {!isConcurrencyLockActive && cartItems.length > 0 && (
                  <button
                    onClick={handleBatchRemoveFromCart}
                    disabled={selectedCartIds.length === 0}
                    className="px-2.5 py-1.5 font-sans font-bold text-[10px] bg-[#DA1E28] hover:bg-[#b0171e] text-white rounded-[4px] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Remove selected ({selectedCartIds.length})
                  </button>
                )}
              </div>

              <Droppable droppableId="cart" isDropDisabled={isConcurrencyLockActive}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 space-y-2.5 min-h-[350px] overflow-y-auto transition-all duration-150 ${
                      snapshot.isDraggingOver ? 'bg-[#FAFAFA] dark:bg-[#1B1B20]' : ''
                    } ${isConcurrencyLockActive ? 'opacity-90 bg-gray-50/50 dark:bg-zinc-900/10' : ''}`}
                  >
                    {cartItems.length === 0 ? (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#CCCCCC] dark:border-[#2D2D39] rounded-[4px]">
                        <svg className="w-10 h-10 text-[#CCCCCC] dark:text-[#393939] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8]">Drag ready test cases here to build release scope.</p>
                      </div>
                    ) : (
                      cartItems.map((item, index) => {
                        const isExecuting = activeExecutingCaseId === item.id;
                        
                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isConcurrencyLockActive}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={`flex items-start p-3 border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] bg-white dark:bg-[#161616] transition-all duration-150 ${
                                  dragSnapshot.isDragging ? 'border-[#0F62FE] ring-1 ring-[#0F62FE]' : ''
                                } ${
                                  isExecuting
                                    ? 'border-l-4 border-l-[#0F62FE] bg-[#0F62FE]/5 dark:bg-[#0F62FE]/5 animate-pulse border-y-[#0F62FE] border-r-[#0F62FE]'
                                    : 'hover:border-[#A8A8A8] dark:hover:border-[#393939]'
                                }`}
                              >
                                {/* Batch Checkbox (Disabled during lock) */}
                                <div className="pt-0.5 pr-2.5">
                                  <input
                                    type="checkbox"
                                    checked={selectedCartIds.includes(item.id)}
                                    disabled={isConcurrencyLockActive}
                                    onChange={() => handleCartCheckboxToggle(item.id)}
                                    className="w-3.5 h-3.5 border border-[#CCCCCC] dark:border-[#393939] rounded-[2px] bg-white dark:bg-[#1C1C21] text-[#0F62FE] focus:ring-offset-0 focus:ring-[#0F62FE] cursor-pointer disabled:cursor-not-allowed"
                                  />
                                </div>

                                {/* Drag Handle (Hidden/disabled during active lock) */}
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className={`pt-1 pr-2 text-gray-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing ${
                                    isConcurrencyLockActive ? 'pointer-events-none opacity-20' : ''
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 2a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm6-12a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2z" />
                                  </svg>
                                </div>

                                {/* Item Info & Custom badges */}
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex justify-between items-start">
                                    <span className="font-mono text-[9px] font-bold text-[#8A3FFC] bg-[#8A3FFC]/10 border border-[#8A3FFC]/30 px-1.5 py-0.5 rounded-[2px] uppercase">
                                      {item.testCase.id}
                                    </span>

                                    {/* Execution pill state with left matching color dot */}
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                                      item.executionStatus === 'PASSED' ? 'bg-[#198038]/10 text-[#198038]' :
                                      item.executionStatus === 'FAILED' ? 'bg-[#DA1E28]/10 text-[#DA1E28]' :
                                      'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                        item.executionStatus === 'PASSED' ? 'bg-[#198038]' :
                                        item.executionStatus === 'FAILED' ? 'bg-[#DA1E28]' : 'bg-[#F1C21B]'
                                      }`}></span>
                                      {item.executionStatus}
                                      {item.retryCount > 0 && <span className="ml-1 text-[8px] text-[#F1C21B]">(Retry)</span>}
                                    </div>
                                  </div>

                                  <h4 className="font-sans font-semibold text-xs text-[#161616] dark:text-white mt-1.5 leading-normal">
                                    {item.testCase.title}
                                  </h4>
                                  
                                  {isExecuting && (
                                    <p className="font-mono text-[9px] text-[#0F62FE] mt-1.5 font-bold tracking-tight animate-pulse">
                                      RUNNING AUTOMATION CONTROLLER...
                                    </p>
                                  )}
                                </div>

                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

          </div>
        </DragDropContext>

      </main>
    </div>
  );
};
export default TestRunCuration;
