// import React, { useState, useEffect } from 'react';
// import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Loader2 } from 'lucide-react';

// const PostponeModal = ({ classId, onClose, onSuccess }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [availableRooms, setAvailableRooms] = useState([]);
//   const [classDetails, setClassDetails] = useState(null);
//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split('T')[0],
//     startTime: '',
//     endTime: '',
//     classroomId: ''
//   });

//   // Fetch class details and available rooms
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError('');

//         // Fetch class details
//         const classResponse = await fetch(`http://localhost:3000/api/timetable/class/${classId}`, {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           }
//         });

//         if (!classResponse.ok) throw new Error('Failed to fetch class details');
//         const classData = await classResponse.json();
//         setClassDetails(classData);
        
//         // Initialize form with class times
//         setFormData(prev => ({
//           ...prev,
//           startTime: classData.start_time.slice(0, 5),
//           endTime: classData.end_time.slice(0, 5)
//         }));

//         // Fetch available rooms
//         const roomsResponse = await fetch('http://localhost:3000/api/timetable/available-rooms', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             date: formData.date,
//             startTime: classData.start_time,
//             endTime: classData.end_time
//           })
//         });

//         if (!roomsResponse.ok) throw new Error('Failed to fetch available rooms');
//         const roomsData = await roomsResponse.json();
//         setAvailableRooms(roomsData);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [classId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError('');

//       const response = await fetch('http://localhost:3000/api/timetable/postpone-class', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           classId,
//           newDate: formData.date,
//           newStartTime: formData.startTime,
//           newEndTime: formData.endTime,
//           newClassroomId: formData.classroomId,
//           validUntil: formData.date
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to postpone class');
//       }

//       onSuccess();
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AlertDialog open={true} onOpenChange={onClose}>
//       <AlertDialogContent className="sm:max-w-md">
//         <AlertDialogHeader>
//           <AlertDialogTitle>Postpone Class</AlertDialogTitle>
//           <AlertDialogDescription>
//             {classDetails && `Postponing: ${classDetails.course_name}`}
//           </AlertDialogDescription>
//         </AlertDialogHeader>

//         {error && (
//           <Alert variant="destructive">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">New Date</label>
//             <input
//               type="date"
//               className="mt-1 w-full rounded-md border border-gray-300 p-2"
//               min={new Date().toISOString().split('T')[0]}
//               value={formData.date}
//               onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Start Time</label>
//             <input
//               type="time"
//               className="mt-1 w-full rounded-md border border-gray-300 p-2"
//               value={formData.startTime}
//               onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">End Time</label>
//             <input
//               type="time"
//               className="mt-1 w-full rounded-md border border-gray-300 p-2"
//               value={formData.endTime}
//               onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Classroom</label>
//             <select
//               className="mt-1 w-full rounded-md border border-gray-300 p-2"
//               value={formData.classroomId}
//               onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
//               required
//             >
//               <option value="">Select a classroom</option>
//               {availableRooms.map((room) => (
//                 <option key={room.id} value={room.id}>
//                   {room.room_number} (Capacity: {room.capacity})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <AlertDialogFooter>
//             <button
//               type="button"
//               onClick={onClose}
//               className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
//               disabled={loading}
//             >
//               {loading ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 'Confirm Postpone'
//               )}
//             </button>
//           </AlertDialogFooter>
//         </form>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// };

// export default PostponeModal;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { Loader2 } from 'lucide-react';

const PostponeModal = ({ classId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    classroomId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const classResponse = await fetch(`http://localhost:3000/api/timetable/class/${classId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!classResponse.ok) throw new Error('Failed to fetch class details');
        const classData = await classResponse.json();
        setClassDetails(classData);
        
        setFormData(prev => ({
          ...prev,
          startTime: classData.start_time.slice(0, 5),
          endTime: classData.end_time.slice(0, 5)
        }));

        const roomsResponse = await fetch('http://localhost:3000/api/timetable/available-rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date: formData.date,
            startTime: classData.start_time,
            endTime: classData.end_time
          })
        });

        if (!roomsResponse.ok) throw new Error('Failed to fetch available rooms');
        const roomsData = await roomsResponse.json();
        setAvailableRooms(roomsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3000/api/timetable/postpone-class', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId,
          newDate: formData.date,
          newStartTime: formData.startTime,
          newEndTime: formData.endTime,
          newClassroomId: formData.classroomId,
          validUntil: formData.date
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to postpone class');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Postpone Class</DialogTitle>
          <DialogDescription>
            {classDetails && `Postponing: ${classDetails.course_name}`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              min={new Date().toISOString().split('T')[0]}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Classroom</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
              required
            >
              <option value="">Select a classroom</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_number} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Confirm Postpone'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostponeModal;
