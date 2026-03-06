'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { UserProfile, Company } from '@/lib/types';

export function useProfile() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const adminCompanyId = searchParams.get('adminCompanyId');

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!user) {
            setProfile(null);
            setCompany(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Listen to user profile
        const userRef = doc(firestore, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const profileData = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as UserProfile;

                // --- One-time elevation for Super Admin ---
                if (profileData.email === 'magloire078@gmail.com' && profileData.role !== 'superadmin') {
                    updateDoc(userRef, { role: 'superadmin' }).catch(console.error);
                    profileData.role = 'superadmin';
                }

                setProfile(profileData);

                // If user has a company (or is superadmin impersonating one), listen to it
                const targetCompanyId = (profileData.role === 'superadmin' && adminCompanyId)
                    ? adminCompanyId
                    : profileData.companyId;

                if (targetCompanyId) {
                    const companyRef = doc(firestore, 'companies', targetCompanyId);
                    const unsubscribeCompany = onSnapshot(companyRef, (companySnap) => {
                        if (companySnap.exists()) {
                            setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
                        }
                        setIsLoading(false);
                    }, (err) => {
                        // Silent error for company fetch during initial setup
                        if (err.code !== 'permission-denied') {
                            console.error("Error fetching company:", err);
                            setError(err);
                        }
                        setIsLoading(false);
                    });

                    return () => {
                        unsubscribeCompany();
                    };
                } else {
                    setCompany(null);
                    setIsLoading(false);
                }
            } else {
                // Profile doesn't exist yet
                setProfile(null);
                setCompany(null);
                setIsLoading(false);
            }
        }, (err) => {
            console.error("Error fetching user profile:", err);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribeUser();
    }, [user, isAuthLoading, firestore]);

    return {
        profile,
        company,
        isLoading: isLoading || isAuthLoading,
        error,
        isOwner: profile?.role === 'owner',
        isEmployee: profile?.role === 'employee',
        isSuperAdmin: profile?.role === 'superadmin',
    };
}
